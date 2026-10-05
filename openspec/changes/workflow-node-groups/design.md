## Context

See proposal.md for motivation and the specs for behavior. Code anchors below were checked against `master` on 2026-10-05.

- Store nodes are flat with absolute positions. Backend export sorts by position (`byNodePositionLabelAndId`) and throws on any node unreachable from a root (`resolveBackendOrder`). ELK layout (`layout/elk-layout.ts`: `buildElkGraph`, `applyElkLayout`, `computeWorkflowAutoLayout`) builds a flat graph from the store nodes. A group modeled as a store node would break all three.
- `WorkflowGraphState` is the unit of history (`commitGraphState`). A node drag commits once on drag stop through `nodeDragOriginGraph` (`store/slices/graph-slice.ts`).
- About 57 modules read `nodes` and assume every entry is a registry kind.
- Graph-engine commands follow `applyXCommand` (`graph-engine/commands.ts`). `deleteNodes` and `duplicateNodes` live in `store/slices/node-crud-slice.ts` (`DUPLICATE_NODE_OFFSET = 40`).
- `use-node-change-router.ts` splits React Flow node changes into selection and structural channels.
- The node context menu and the selection toolbar both render `SELECTION_COMMANDS` (`selection-commands/selection-commands.ts`). Commands have no availability rule; the toolbar shows for two or more selected nodes.
- Large graphs (`LARGE_GRAPH_MIN_NODES = 100`): the canvas enables `onlyRenderVisibleElements` by `nodes.length`, while `compact-node.tsx` compares `state.nodeLookup.size`. An unmeasured compact node sizes itself with `getEstimatedNodeHeight`.
- The minimap already draws nodes of type `"groupFrame"` in a separate layer beneath the nodes (`MINIMAP_FRAME_NODE_TYPE`, `framesD`).
- Observe mode is `useRuntimeMode() === "observe"`; per-node runtime status comes from `useNodeRuntimeState`.
- Canvas search reveals through `revealNode` provided by the canvas to `workflow-editor.tsx`.

## Goals / Non-Goals

**Goals:**
- Groups cost nothing to modules that do not care about them: no filtering in existing node consumers.
- One function decides where `groups` lands in the backend payload.
- Collapse is purely a canvas projection: store nodes and edges never change when a group collapses.

**Non-Goals:**
- React Flow sub-flows (`parentId`, relative positions, `extent: "parent"`): relative coordinates would leak into the DTOs, backend ordering, ELK, search, and reveal.
- Nested groups. Adding an optional parent reference to `WorkflowGroup` later is additive and needs no migration; hierarchical ELK can follow.
- Executable containers. A loop body or scope would be a registry node kind with ports, never a group.
- An empty group in the node palette.

## Decisions

### D1. Groups live beside nodes and own their geometry

`WorkflowGraphState` gains `groups: WorkflowGroup[]`:

```ts
interface WorkflowGroup {
  id: string
  label: string
  color: KnownOr<WorkflowGroupColor>
  x: number
  y: number
  width: number   // expanded rectangle, also kept while collapsed
  height: number
  collapsed: boolean
}
```

Membership is stored on the node as `node.data.groupId?: string`.

- Membership on the node makes "at most one group" structural; nothing to check at runtime.
- The rectangle is stored because a group can be empty, and a rectangle derived from members has nothing to derive from. It also keeps the frame from jumping as members move.
- Being in graph state gives history, snapshots, drag commits, and clipboard plumbing for free.
- DTOs use `groups[].nodeIds` instead; converters translate.
- *Alternative:* derive the frame from member bounds (the earlier version of this change). Rejected: no empty groups, no resize, and collapse would have nothing to restore.
- *Alternative:* `nodeIds` in the store too. Rejected: two places to keep consistent, and a node in two groups becomes representable.

`clearDanglingGroupIds(graph)` clears a `groupId` that points to a missing group. It runs after ungroup, delete group, and import. Empty groups are never removed implicitly.

### D2. Geometry rules are pure functions

`group-geometry.ts` owns:
- `getMemberBounds(members)` — uses `measured` size, falling back to `DEFAULT_NODE_WIDTH` and `getEstimatedNodeHeight(node)` so a frame matches what an unmeasured compact node draws.
- `growToFit(group, members)` — expands the rectangle to enclose members plus `GROUP_FRAME_PADDING` and `GROUP_FRAME_HEADER_HEIGHT`; never shrinks.
- `fitToContents(group, members)` — exact fit for non-empty groups.
- `clampResize(group, members, nextRect)` — minimum is member bounds plus padding, or `GROUP_MIN_WIDTH × GROUP_MIN_HEIGHT` for an empty group.
- `getCollapsedCardRect(group)` — fixed size at the group's `x, y`.

`growToFit` runs inside the commit that moves members, so a drag that pushes a member outward is still one history step.

### D3. Frames and cards are derived React Flow nodes

The canvas passes `[...groupNodes, ...visibleStoreNodes]` to `ReactFlow`. `buildGroupCanvasNodes(groups, nodes, collapsedOverride)` is memoized per group:

- Expanded: `id: "group-frame:<groupId>"`, `type: "groupFrame"`, position and size from the stored rectangle, low `zIndex`, `connectable: false`, `deletable: false`, `dragHandle` on the header, resize handles in edit mode. The frame body has `pointer-events: none`; only the header and handles take pointer events.
- Collapsed: same id, `type: "groupCard"`, card rect, the whole card is the drag handle, decorative non-connectable handles on the left and right.
- Members of collapsed groups get `hidden: true` in the projection. Store nodes are not changed.

The minimap already draws `"groupFrame"` nodes beneath regular nodes; `"groupCard"` is drawn as a regular node.

Large-graph thresholds count store nodes only: `compact-node.tsx` switches from `nodeLookup.size` to a count that excludes group nodes, so the canvas and the nodes agree on the mode.

*Alternative:* a `ViewportPortal` overlay. Rejected as the default because React Flow's drag, `dragHandle`, selection, minimap, and resizer would all have to be rebuilt. It stays the fallback if the spike (task 4.1) cannot keep frames behind edges.

### D4. Proxy edges for collapsed groups

`buildCanvasEdges(edges, groups, collapsedOverride)` projects edges for the canvas:

| Edge | Projection |
|---|---|
| both ends in the same collapsed group | omitted |
| one end in a collapsed group | `id: "group-proxy:<edgeId>"`, endpoint replaced by the card, `selectable: false`, `deletable: false`, insert disabled |
| both ends in different collapsed groups | proxy between the two cards |
| otherwise | unchanged |

Proxies between the same pair of endpoints are merged into one. Branch handles collapse into the card's single input/output; this is accepted for v1.

### D5. Node change routing for group nodes

`use-node-change-router` intercepts ids with the `group-frame:` prefix before the existing channels:

- `position` while dragging → translate the group rectangle and its members by the delta through the existing drag path (`nodeDragOriginGraph`), so the drag is one history step.
- `dimensions` from the resizer → `clampResize`, committed on resize end.
- `select` → the selection slice's `selectedGroupIds`.
- `remove` → ignored (Delete goes through commands, D8).

Box selection: React Flow selects the frame node in `Partial` mode as soon as the box touches it. The router drops a frame `select` change unless the frame rectangle is fully inside the current user selection rectangle (`userSelectionRect` from the React Flow store); member nodes keep the existing Partial behavior.

### D6. Membership after drag and insertion is a pure function

`resolveMembershipAfterDrag(graph, draggedNodeIds)` runs on node drag stop and commits together with the drag:
1. For each dragged node, find the expanded group frames that contain its center. The smallest frame wins.
2. If one is found, the node joins that group; otherwise, if the node was a member and its center is outside its frame, it leaves.
3. `growToFit` the group the node now belongs to.

It does not run when a group is dragged by its header or card. Collapsed cards are never targets. The same resolver runs for one node added from the palette or by quick-add at its insertion position.

### D7. Collapse state: graph value plus observe-mode override

`group.collapsed` is the saved state. In edit mode, toggling it is a graph command (undoable, exported). In observe mode, the canvas keeps `collapsedOverride: Map<groupId, boolean>` in local component state; the projection reads `override ?? group.collapsed`. The override is never written to the store, history, or exports, and is dropped on mode change.

Collapsing in edit mode deselects members in the same commit. Reveal (`revealNode`) checks whether the node's group is collapsed and expands it first: in edit mode through the graph command, in observe mode through the override.

The card summarizes members: an error indicator from the existing visible-validation selector, and in observe mode the aggregate runtime status from `useNodeRuntimeState` with precedence error > running > done > idle.

### D8. Commands and availability

New graph-engine commands, following the `applyXCommand` pattern: `applyGroupNodesCommand`, `applyUngroupCommand`, `applyRenameGroupCommand`, `applyRecolorGroupCommand`, `applyResizeGroupCommand`, `applyFitGroupCommand`, `applySetGroupCollapsedCommand`, `applyMoveGroupCommand`. The default label comes from `createUniqueLabel` (`Group 1`, `Group 2`, …).

`node-crud-slice.ts`:
- `deleteNodes` and `deleteGroups` keep empty groups; deleting a group deletes its members and their edges.
- `duplicateNodes` and paste copy whole groups (selected groups, plus groups whose members were all copied) with new ids, offset by `DUPLICATE_NODE_OFFSET` together with members; partially copied members are ungrouped.

`SelectionCommand` gains `isAvailable(selection): boolean`, where `selection` describes selected nodes, selected groups, and whether any selected node is grouped. New commands: `group`, `ungroup`, `toggle-collapse`. Rules:

| Selection | Commands |
|---|---|
| ≥ 2 nodes, none grouped, no groups | Copy, Duplicate, Group, Delete |
| any grouped node, no groups | Copy, Duplicate, Delete |
| exactly one group | Copy, Duplicate, Collapse/Expand, Ungroup, Delete |
| groups + nodes, or several groups | Copy, Duplicate, Delete |

The node context menu uses the same rules for its node. The canvas shows a second `NodeToolbar` anchored to the frame node when groups are selected.

Hotkeys: `Mod+G` and `Mod+Shift+G` in `components/hotkeys/hotkeys.ts`, with `preventDefault`, gated on the same availability rules.

### D9. Auto-layout with groups

In `buildElkGraph`, each collapsed group replaces its members with one ELK node sized like its card, and edges to members are attached to that node. After layout, hidden members move by the same delta as their block. Then every non-empty expanded group is fitted with `fitToContents`. Empty groups keep their rectangles. Hierarchical ELK for expanded groups is out of scope.

### D10. Color is a token, not a hex value

`WORKFLOW_GROUP_COLORS = ["gray", "blue", "green", "yellow", "orange", "red", "purple", "pink"] as const`, default `"blue"`. Frame and card styles are `tv` definitions with a `color` variant supplying light and dark classes. The DTO type is `KnownOr<WorkflowGroupColor>`; the domain decoder normalizes unknown tokens to the default.

### D11. The backend placement lives in one function

`mappers/backend-export/backend-groups.ts` owns:
- `toBackendGroups(groups, backendIdByDomainId)` — maps `nodeIds` to numeric ids, sorted ascending.
- `attachBackendGroups(dto, backendGroups)` — currently returns `{ ...dto, groups }`.

`BackendWorkflowDTO` gains `groups: BackendWorkflowGroupDTO[]` with `{ id, label, color, x, y, width, height, collapsed, nodeIds }`. Export ordering, numbering, and validation never read groups. Sorting `nodeIds` (here and in the domain export) keeps output deterministic for diffs and snapshot tests; membership has no order.

### D12. Domain and clipboard codecs

- `toDomainDTO` decodes `groups` (missing → `[]`) and validates shape, finite numbers, positive size, unknown node, duplicate membership, and duplicate id.
- `internalToDomain` builds sorted `nodeIds` from `data.groupId`; `domainToInternal` sets `data.groupId` from `nodeIds`.
- The clipboard payload gains optional `groups` with rectangle and collapsed state; paste assigns new ids.

## Risks / Trade-offs

- [Frames stacking above edges or nodes] → Spike first (task 4.1). The `ViewportPortal` fallback is isolated to the canvas layer.
- [Box-select filtering depends on React Flow's internal `userSelectionRect`] → Covered by a router test; if the field changes, fall back to comparing the frame with the selected nodes' bounds.
- [Proxy edges lose which branch handle an edge left from] → Accepted for v1; the expanded view is one click away.
- [A stored rectangle can enclose foreign nodes after manual moves] → Membership is explicit (`groupId`), never inferred from overlap, so foreign nodes are only drawn over, not captured.
- [ELK places members of an expanded group apart and the fitted frame stretches over foreign nodes] → Accepted for v1; hierarchical ELK can come later without changing the data model.
- [Frame projection on every drag frame of large graphs] → Memoized per group on member positions and sizes; covered by the existing performance budget test (`store.performance.test.ts`).
- [`data.groupId` is visible to host code that reads node data] → Optional; hosts already tolerate the index signature.

## Migration Plan

Additive. Old domain JSON without `groups` still imports. The backend must tolerate the new top-level `groups` key; if it cannot, `attachBackendGroups` moves it into `metadata.groups` (D11). Rollback means removing the UI entry points; stored groups stay inert.
