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
- `clampResize(group, members, nextRect)` — minimum is member bounds plus padding, or `GROUP_MIN_WIDTH × GROUP_MIN_HEIGHT` for an empty group. The edge opposite the one being dragged stays fixed: when the left or top edge hits the minimum, `x` / `y` are clamped so the right / bottom edge does not move.
- `getCollapsedCardRect(group)` — fixed size at the group's `x, y`.

`growToFit` runs inside the commit that moves members, so a drag that pushes a member outward is still one history step. While a member is being dragged, `previewGroupGrowth` grows the frame from its pre-drag rectangle (`nodeDragOriginGraph.groups`) to enclose the members whose center is still inside it, so the frame follows the member instead of jumping on drop, and a member dragged out is not followed. These mid-drag writes go through the existing transient drag path (recorded with history suppressed), so the drag stays one step; on drop `resolveMembershipAfterDrag` judges containment against the pre-drag rectangles.

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

- `position` with `dragging` set → translate the group rectangle and its members by the delta through the existing drag path (`nodeDragOriginGraph`), so the drag is one history step.
- Resize → `clampResize`, committed on resize end. `NodeResizer` dragged by the left or top edge emits a `position` change **without** `dragging` together with a `dimensions` change with `resizing: true`. The router treats a frame `position` change as part of a resize whenever the same batch has a `resizing` dimensions change or `dragging` is unset. It never translates members for such a change.
- `select` → the selection slice's `selectedGroupIds`.
- `remove` → ignored (Delete goes through commands, D8).

Drag-commit check: the "nothing moved, nothing to undo" shortcut in `graph-slice.ts` (`haveNodePositionsChanged`) compares nodes only. It is extended to compare group rectangles as well, otherwise dragging an empty group would never reach history.

Mixed drags: React Flow drags every selected React Flow node. When a frame is dragged together with selected nodes, the router drops the React Flow position changes for members of the dragged groups (they move only through the group translation, never twice). Selected non-members move by React Flow's own changes as usual.

Selection (revised after the spike, task 4.1): group nodes are `selectable: false` and `focusable: false` in React Flow, so the router never sees a frame `select` change. Filtering React Flow's frame selection does not work: during a box selection React Flow emits the select changes before it stores the new `userSelectionRect`, and it remembers the frame as selected, so a dropped change is never re-sent. The canvas owns group selection instead (`useGroupCanvasProjection`): a header or card click selects the group (a modifier click toggles it), `onSelectionEnd` selects the groups whose frame or card lies fully inside the last box (remembered through a React Flow store subscription), and a plain node click or a new box clears selected groups. React Flow still drags a frame whose `selected` prop is set, so mixed drags work.

Selected frames: React Flow adds 1000 to a selected node's z-index; a selected frame's `zIndex` takes that lift back so it stays beneath nodes and edges. Two consequences, found by the e2e (task 8.2):
- `NodeToolbar` stacks just above the nodes it belongs to, so the group toolbar would sit under the pane; the canvas passes it an explicit z-index while a group is selected.
- After a box selection React Flow keeps its multi-selection overlay (`nodesSelectionActive`); once no workflow node is selected (the box was just grouped) the overlay would cover the group header and swallow its clicks, so the canvas turns it off.

### D6. Membership after drag and insertion is a pure function

`resolveMembershipAfterDrag(graph, draggedNodeIds)` runs on node drag stop and commits together with the drag:
1. For each dragged node, find the expanded group frames that contain its center. The smallest frame wins.
2. If one is found, the node joins that group; otherwise, if the node was a member and its center is outside its frame, it leaves.
3. `growToFit` the group the node now belongs to.

It does not run for the dragged groups or their members when a group is dragged by its header or card. In a mixed drag (groups plus selected non-member nodes), it still runs for the non-member nodes. Collapsed cards are never targets. The same resolver runs for one node added from the palette or by quick-add at its insertion position.

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
| ≥ 1 node, none grouped, no groups | Copy, Duplicate, Group, Delete |
| any grouped node, no groups | Copy, Duplicate, Delete |
| exactly one group | Copy, Duplicate, Collapse/Expand, Ungroup, Delete |
| groups + nodes, or several groups | Copy, Duplicate, Delete |

A single node can be grouped: the selection toolbar still appears only for two or more nodes, so a one-node group comes from the node context menu or `Mod+G`.

The node context menu uses the same rules for its node. A right-click on a group header or a collapsed card opens a group context menu that renders the same commands as the group toolbar, selecting the group first if it was not selected. The canvas shows a second `NodeToolbar` anchored to the frame node when groups are selected.

Delete: frames are `deletable: false`, so React Flow's `deleteKeyCode` never removes a group. The editor's delete path (the `delete` node-edit hotkey and the toolbar command) calls `deleteGroups(selectedGroupIds)` together with `deleteNodes` for the selected nodes, in one commit. When a group and some of its members are selected together, the group wins: the whole group with all members is deleted.

Hotkeys: `Mod+G` and `Mod+Shift+G` in `components/hotkeys/hotkeys.ts` through `isLetterHotkey`, so they work on non-Latin layouts, with `preventDefault`, gated on the same availability rules.

Accessibility: the frame header and the collapsed card are focusable and carry `aria-label` with the group label and member count. `Enter` on a focused header or card selects the group.

### D9. Auto-layout with groups

In `buildElkGraph`, each collapsed group replaces its members with one ELK node sized like its card, and edges to members are attached to that node. After layout, hidden members move by the same delta as their block. Then every non-empty expanded group is fitted with `fitToContents`. Empty groups keep their rectangles. Hierarchical ELK for expanded groups is out of scope.

### D10. Color is a token, not a hex value

`WORKFLOW_GROUP_COLORS = ["gray", "blue", "green", "yellow", "orange", "red", "purple", "pink"] as const`, default `"blue"`. Frame and card styles are `tv` definitions with a `color` variant supplying light and dark classes. The DTO type is `KnownOr<WorkflowGroupColor>`; the domain decoder normalizes unknown tokens to the default.

### D11. The backend placement lives in one function

`mappers/backend-export/backend-groups.ts` owns:
- `toBackendGroups(groups, backendIdByDomainId)` — maps `nodeIds` to numeric ids, sorted ascending.
- `attachBackendGroups(dto, backendGroups)` — returns `{ ...dto, groups }`. The backend accepts the top-level `groups` key (confirmed).

`BackendWorkflowDTO` gains `groups: BackendWorkflowGroupDTO[]` with `{ id, label, color, x, y, width, height, collapsed, nodeIds }`. Export ordering, numbering, and validation never read groups. Sorting `nodeIds` (here and in the domain export) keeps output deterministic for diffs and snapshot tests; membership has no order.

### D12. Domain and clipboard codecs

- `toDomainDTO` decodes `groups` (missing → `[]`) and validates shape, finite numbers, positive size, unknown node, duplicate membership, and duplicate id.
- `internalToDomain` builds sorted `nodeIds` from `data.groupId`; `domainToInternal` sets `data.groupId` from `nodeIds`.
- The clipboard payload gains optional `groups` with rectangle and collapsed state; paste assigns new ids.

### D13. Canvas search matches group labels

Today every `SearchMatch` points at a node. A group has no kind, fields, or variables, so a group label match is a new match target, not a new source:

`SearchMatch` (`search/matches.ts`) today requires `nodeId`. It becomes a union on a `target` discriminant, and node-only consumers (field marks, node status selectors) narrow on `target === "node"`:

```ts
type SearchMatch =
  | (NodeSearchMatchFields & { target: "node"; nodeId: string })   // today's shape
  | { target: "group"; groupId: string; source: "label"; key: string;
      occurrence: number; start: number; end: number; sortTuple: SearchSortTuple }
```

- Filter: group label matches fall under the existing `labels` source filter and count toward it.
- Order: a group sorts by its rectangle's `x, y` together with nodes. At equal positions the group comes before nodes, so a group precedes its members.
- Results panel: a group row shows a group icon, the group label, and "Group" in place of the kind title. It is a single-match entry with no nested field rows.
- Marking: the label in the frame header or on the collapsed card is marked as a match or the current match.
- Reveal: centers the group header (the frame can be larger than the viewport) with the same minimum readable zoom rule. A collapsed group is **not** expanded; its card is centered.
- Hidden members stay searchable while their group is collapsed; revealing one expands the group (D7).
- Cache: the full index in `search-selectors.ts` is keyed by `nodes` and `groups`; current-match reconciliation keeps a group match by `groupId` and occurrence.

### Spike outcome (task 4.1)

Checked in the running app (Playwright, Chromium) on a pasted graph with a group: the frame paints beneath nodes and edges (an edge inside the frame is hit first), a press on the frame body reaches the pane and pans, a header click selects the group and shows the group toolbar, a box that crosses the frame does not select it while a box that encloses it does, dragging the header moves the members and undoes in one step, resizing from the left edge leaves members and the right edge in place and stops at the members, inline rename works, and collapsing shows the card with a proxy edge. The derived-node approach stays; the `ViewportPortal` fallback is not needed. One fix came out of it: the selected-frame z-index lift above.

## Risks / Trade-offs

- [Frames stacking above edges or nodes] → Spike first (task 4.1). The `ViewportPortal` fallback is isolated to the canvas layer.
- [Box-select enclosure reads React Flow's `userSelectionRect` through a store subscription] → If the field changes, compare the frames with the selected nodes' bounds instead.
- [Proxy edges lose which branch handle an edge left from] → Accepted for v1; the expanded view is one click away.
- [A stored rectangle can enclose foreign nodes after manual moves] → Membership is explicit (`groupId`), never inferred from overlap, so foreign nodes are only drawn over, not captured.
- [ELK places members of an expanded group apart and the fitted frame stretches over foreign nodes] → Accepted for v1; hierarchical ELK can come later without changing the data model.
- [Frame projection on every drag frame of large graphs] → Memoized per group on member positions and sizes; covered by the existing performance budget test (`store.performance.test.ts`).
- [`data.groupId` is visible to host code that reads node data] → Optional; hosts already tolerate the index signature.

## Migration Plan

Additive. Old domain JSON without `groups` still imports. The backend accepts the new top-level `groups` key. Rollback means removing the UI entry points; stored groups stay inert.
