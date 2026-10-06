# Proposal

## Why

Nodes added to a group land wherever the user dropped them, and the only tidy-up tool is the global auto-layout, which ignores groups: it can pull a group's members apart and leaves the frame stretched over unrelated nodes. Users need a way to put just one group in order without touching the rest of the canvas.

## What Changes

- The "Fit to contents" button in an expanded group's header becomes an "Arrange" button that does two things in one step: it lays out the group's members with the same layered layout the editor uses for auto-layout, then fits the frame tightly around them (the current fit behavior).
- The arranged members keep the group where it was: their new arrangement starts at the top-left corner the members occupied before.
- Only edges between two members of the group shape the arrangement; edges to nodes outside the group are ignored in this version.
- Nodes outside the group never move. If the arranged group grows, it may overlap its neighbours; that is accepted for this version.
- Arrange runs only when the user presses the button. Adding, pasting, or dragging a node into a group does not arrange it.
- Arrange is one undoable step. It is offered only in edit mode, for an expanded group with at least one member.
- **BREAKING** (internal API): the "Fit to contents" header action is replaced; the store action `fitGroupToContents` and the graph command behind it are replaced by an async `arrangeGroup`. Frame fitting itself stays and is still used by grouping and auto-layout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-node-groups`: the "Resizing a group" requirement drops the standalone "Fit to contents" action, and a new "Arranging a group" requirement describes the combined layout-and-fit action.

## Impact

- `packages/flow/src/workflow/layout/`: a new group-scoped ELK pass beside `computeWorkflowAutoLayout`, reusing `buildElkGraph`, `applyElkLayout`, the evaluator clearance pass, and `fitToContents`.
- `packages/flow/src/workflow/store/`: `fitGroupToContents` replaced by async `arrangeGroup` in the group slice and store types; it records one history entry and reports layout failures through `lastError`.
- `packages/flow/src/workflow/graph-engine/group-commands.ts`: `applyFitGroupCommand` removed along with its export.
- `packages/flow/src/workflow/components/workflow-groups/group-frame.tsx`: the header button changes label, icon, and handler.
- Tests: group command, store, and component tests that cover "Fit to contents" move to "Arrange".
- No data model, persistence, or dependency changes.
