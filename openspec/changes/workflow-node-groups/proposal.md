## Why

Large workflows are hard to read: there is no way to mark "these five nodes parse the response" on the canvas. Users need a lightweight visual grouping — a named, colored frame around related nodes — that does not change how the workflow executes.

## What Changes

- Add **node groups**: a named, colored frame drawn around its member nodes. A group has no ports and takes part in no connections.
- A group's frame is always derived from its members' bounds (auto-fit); it has no stored position or size.
- Constraints: no nested groups; a node belongs to at most one group; a group with no members does not exist.
- Editor actions: group the selection (hotkey and context menu), ungroup, move a group by dragging its header, join a group by dropping a node onto its frame, leave a group by dragging a node out, rename a group inline, pick a group color from a fixed token palette.
- Group edits are undoable and survive copy/paste and duplicate when the whole group is copied.
- Domain workflow JSON gains an optional `groups` array (`{ id, label, color, nodeIds }`), validated on import.
- Backend DTOs (strict and draft) gain a `groups` array whose `nodeIds` use the exported numeric node IDs. Nodes in the backend payload are unchanged. Where `groups` lands in the backend payload is decided in one place so it can move (e.g. into `metadata`) without touching the rest of the export.
- Auto-layout ignores groups (known limitation: members of one group may be laid out apart).

## Capabilities

### New Capabilities
- `workflow-node-groups`: creating, editing, rendering, and removing visual node groups on the canvas, including membership rules and history/clipboard behavior.

### Modified Capabilities
- `workflow-persistence-v2`: domain JSON, clipboard, and backend export/draft export carry node groups; import validates them.

## Impact

- `packages/flow/src/workflow/types` — group types, `WorkflowGraphState.groups`, DTO shapes.
- `packages/flow/src/workflow/mappers` — domain DTO parsing/validation, converters, backend export, selection clipboard.
- `packages/flow/src/workflow/store` + `graph-engine` — group commands, membership cleanup on node delete, history.
- `packages/flow/src/workflow/components` — group overlay layer on the canvas, hotkey, node context menu entries.
- Backend: must accept (and may ignore) the new top-level `groups` field. Node payloads are unchanged, so execution is unaffected.
