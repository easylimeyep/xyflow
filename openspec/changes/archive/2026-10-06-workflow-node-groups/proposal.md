## Why

Large workflows are hard to read: there is no way to mark "these five nodes parse the response" on the canvas, and no way to fold a finished part of the workflow out of sight. Users need a visual container — a named, colored frame that holds related nodes, can be moved, resized, copied, and collapsed as one piece — without changing how the workflow executes.

## What Changes

- Add **node groups**: a named, colored frame on the canvas that contains member nodes. A group has no ports, takes part in no connections, and does not affect execution.
- A group owns its geometry (`x`, `y`, `width`, `height`). The frame grows automatically when a member is moved past its edge and shrinks only when the user resizes it (with a "Fit to contents" action). Member nodes keep absolute positions.
- Groups may be empty: removing or dragging out every member keeps the group.
- A node belongs to at most one group. Groups are not nested in this change.
- **Collapse**: a group can be collapsed into a compact card. Members and the edges between them are hidden; edges that cross the group boundary are drawn to the card. In edit mode the collapsed state is saved and undoable; in observe mode the viewer can expand or collapse locally without changing the workflow.
- Editor actions:
  - Group the selected nodes, including a single node (`Mod+G`, selection toolbar, node context menu) — only when every selected node is ungrouped.
  - A selected group shows its own toolbar: Copy, Duplicate, Collapse/Expand, Ungroup, Delete (Delete removes the group with its nodes; Ungroup keeps the nodes). `Mod+Shift+G` ungroups the selected group. A right-click on the group header or card opens the same commands as a context menu.
  - Move a group by dragging its header (members move with it exactly once, even when also selected); resize it by its edges; rename inline; pick a color from a fixed token palette.
  - Join a group by dropping a node inside its frame (including a node dropped from the node palette); leave by dragging the node out.
- Selection: a click on the header selects the group; a box selection selects a group only when it encloses the whole frame. The header and card are reachable from the keyboard.
- A collapsed group summarizes its members: validation errors and runtime status show on the card; revealing a search hit inside it expands the group.
- **Canvas search finds groups by label**: group labels are matched under the labels filter, listed in the results panel, and marked on the frame header or card; revealing a group centers its header without expanding a collapsed group.
- Auto-layout treats a collapsed group as one block and fits every non-empty expanded frame around its members afterwards.
- The shared selection command list gains availability rules so the toolbar and context menu show only the commands that apply.
- The initial-graph builders accept `groups` (members, label, color, collapsed) and the package exports the group types, so a host can start a workflow with groups.
- Domain workflow JSON and backend DTOs (strict and draft) gain a `groups` array with geometry and collapsed state; backend `nodeIds` use the exported numeric node ids. Backend node payloads are unchanged.

## Capabilities

### New Capabilities
- `workflow-node-groups`: creating, selecting, editing, collapsing, and removing node groups on the canvas, including membership rules, history, clipboard, auto-layout, search, validation, and observe-mode behavior.

### Modified Capabilities
- `workflow-persistence-v2`: domain JSON, clipboard, and backend export/draft export carry node groups with geometry and collapsed state; import validates them.
- `workflow-initial-graph-builders`: the compact initial-graph input declares groups, and both builders place and fit them.

## Non-Goals

- Adding an empty group from the node palette.
- Nested groups. The data model allows adding a parent reference later as an optional field without migration.
- Executable containers (loop bodies, scopes, sub-workflows). These would be separate node kinds in the registry, not groups.

## Impact

- `packages/flow/src/workflow/types` — group types, `WorkflowGraphState.groups`, DTO shapes.
- `packages/flow/src/workflow/mappers` — domain DTO decoding/validation, converters, backend export, selection clipboard.
- `packages/flow/src/workflow/store` + `graph-engine` — group commands, delete/duplicate/paste, drag membership, history, observe-mode collapse override.
- `packages/flow/src/workflow/layout` — collapsed groups as single ELK blocks, frame fitting after layout.
- `packages/flow/src/workflow/selection-commands` — availability rules, group commands.
- `packages/flow/src/workflow/search` + `store/search-selectors.ts` — group label matches, ordering, and cache keyed on groups.
- `packages/flow/src/workflow/components` — group frame and collapsed card on the canvas, proxy edges, node change routing, selection toolbar, group context menu, hotkeys, search results and reveal.
- Backend: accepts the new top-level `groups` field (confirmed). Node payloads are unchanged, so execution is unaffected.
