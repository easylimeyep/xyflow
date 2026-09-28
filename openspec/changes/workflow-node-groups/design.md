## Context

See proposal.md for motivation and specs for behavior.

Current state that shapes the approach:

- Store nodes are flat with absolute positions. Backend export sorts by position (`byNodePositionLabelAndId`), and ELK layout (`layout/elk-layout.ts`) builds a flat graph from them.
- Backend export throws on any node that is unreachable from a root (`resolveBackendOrder`). A group modeled as a node with no edges would make every workflow non-exportable.
- `WorkflowGraphState` is the unit of history. Everything in it gets undo/redo and a single-commit drag (via `nodeDragOriginGraph`) for free.
- About 57 modules read `nodes` and assume every entry is a registry kind (validation, config panel, variable scopes, clipboard, palette counts).

## Goals / Non-Goals

**Goals:**
- Groups add no cost to modules that do not care about them. No filtering is needed in the existing node consumers.
- Where `groups` lands in the backend payload is decided by one function.
- Frame geometry is derived data, never persisted.

**Non-Goals:**
- React Flow sub-flows (`parentId`, relative positions, `extent: "parent"`).
- Nested groups, or group-aware ELK layout (hierarchical layout can come later without changing the data model).
- Collapsing a group.

## Decisions

### D1. Groups live beside nodes, not among them

`WorkflowGraphState` gains `groups: WorkflowGroup[]` where `WorkflowGroup = { id, label, color }`. Membership is stored on the node as `node.data.groupId?: string`.

- Keeping membership on the node enforces "at most one group" in the structure itself; no invariant needs checking at runtime.
- Because groups are part of the graph state, history, snapshots, and `commitGraphState` cover them without extra work.
- The DTOs use `groups[].nodeIds` instead, which is the natural shape for the backend. Converters translate between the two shapes.
- *Alternative considered:* `nodeIds` in the store too. Rejected: every membership change would have to update two places consistently, and a node in two groups becomes representable.

An invariant helper, `pruneEmptyGroups(graph)`, runs after every command that can drop membership (delete nodes, ungroup, drag-out, regroup). It removes groups with no members and clears a `groupId` that points to a missing group.

### D2. Frames are derived React Flow nodes, not store nodes

The canvas passes `[...frameNodes, ...storeNodes]` to `ReactFlow`. `frameNodes` is a memoized projection built by `buildGroupFrameNodes(groups, nodes)`:

- One node per group: `id: "group-frame:<groupId>"`, `type: "groupFrame"`, `connectable: false`, `deletable: false`, `dragHandle` = header, `zIndex` below nodes.
- Position and size come from the members' bounds (`measured` size, falling back to `DEFAULT_NODE_WIDTH/HEIGHT`), plus `GROUP_FRAME_PADDING` and `GROUP_FRAME_HEADER_HEIGHT`.
- The frame body has `pointer-events: none`. Panning, box selection, and clicks on edges pass through it. Only the header takes pointer events.

`use-node-change-router` intercepts changes whose id has the frame prefix:
- `position` with dragging: translates to member moves by the delta. This goes through the existing drag path, so the whole drag is one history step.
- `select`: forwarded to the selection slice as the selected group (used by `Mod+Shift+G` and header styling).
- `dimensions` and `remove`: ignored.

Why this over a `ViewportPortal` overlay: React Flow's own drag handling, `dragHandle`, selection, minimap, and `getIntersectingNodes` all work unchanged. With an overlay, pointer dragging and the conversion between screen and flow coordinates would have to be written by hand. Fallback: if a spike (task 3.1) shows the frame cannot be kept visually behind edges, switch to a `ViewportPortal` overlay. The store and DTO design stay the same either way.

### D3. Membership after drag is a pure function

`resolveMembershipAfterDrag(graph, draggedNodeIds, measure)` runs on node drag stop and commits together with the drag. For each dragged node it:
1. Computes every group's frame without the dragged nodes.
2. If the node's center lies inside a frame, the node joins that group. If several frames contain the center, the smallest frame wins.
3. Otherwise, if the node was in a group and other members remain, the node leaves it.
4. Runs `pruneEmptyGroups`.

When a whole group is dragged by its header, none of this runs.

### D4. Commands in the graph engine

The graph engine gets new commands next to the existing ones in `graph-engine/commands.ts`, following the same `GraphEngineResult` pattern: `groupNodes(nodeIds)`, `ungroup(groupId)`, `renameGroup(groupId, label)`, `recolorGroup(groupId, color)`. Node delete and duplicate are extended to call `pruneEmptyGroups` and to regroup copies of whole groups. A default label comes from the existing naming helpers (`Group 1`, `Group 2`, …).

### D5. Color is a token, not a hex value

`WORKFLOW_GROUP_COLORS = ["gray", "blue", "green", "yellow", "orange", "red", "purple", "pink"] as const`, default `"blue"`. The frame style is a `tv` definition with a `color` variant, and each variant supplies light and dark classes. The type is `KnownOr<WorkflowGroupColor>` in the DTO, so a host or backend can send a future token. The domain decoder normalizes unknown tokens to the default.

### D6. The backend placement lives in one function

`mappers/backend-export/backend-groups.ts` owns:
- `toBackendGroups(groups, backendIdByDomainId)`: maps `nodeIds` to numeric ids, sorted ascending.
- `attachBackendGroups(dto, backendGroups)`: currently returns `{ ...dto, groups }`.

`BackendWorkflowDTO` gains `groups: BackendWorkflowGroupDTO[]`. To move groups into `metadata.groups`, change `attachBackendGroups` and the DTO type. Export ordering, numbering, and validation never read groups.

### D7. Domain and clipboard codecs

- `toDomainDTO` decodes `groups` (missing → `[]`) and validates it: shape, non-empty `nodeIds`, unknown node, duplicate membership, duplicate group id.
- `internalToDomain` builds `nodeIds` from `data.groupId`. `domainToInternal` sets `data.groupId` from `nodeIds`.
- The clipboard payload gains optional `groups`. It contains only groups whose members were all copied, and paste assigns them fresh ids.

## Risks / Trade-offs

- [Frames stacking above edges or nodes] → Spike first (task 3.1). The `ViewportPortal` fallback is isolated to the canvas layer.
- [ELK places group members far apart, so the frame stretches over foreign nodes] → Accepted limitation for v1. Hierarchical ELK can be added later without changing the data model.
- [Frames of different groups can overlap, making drop-to-join ambiguous] → The smallest containing frame wins (D3).
- [Frame recomputation on every drag frame of large graphs] → Memoize per group on the member positions and sizes. Only groups whose members moved recompute. Covered by the existing performance budget test.
- [`data.groupId` is visible to host code that reads node data] → It is optional, and hosts already tolerate the `[key: string]: unknown` index signature.

## Migration Plan

This is an additive change. Old domain JSON without `groups` still imports. The backend must tolerate the new top-level `groups` key. If it cannot, flip `attachBackendGroups` to `metadata.groups` (D6). Rollback means removing the UI entry points. Stored `groups` then stay inert.
