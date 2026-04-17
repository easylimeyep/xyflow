## ADDED Requirements

### Requirement: Workflow canvas exposes a manual auto-layout action
The workflow editor SHALL expose a manual auto-layout action from the workflow canvas controls so users can explicitly reorganize the current graph without leaving the canvas.

#### Scenario: Auto-layout action is available in canvas controls
- **WHEN** the workflow canvas is rendered
- **THEN** the controls area SHALL include an auto-layout action alongside the existing navigation controls

#### Scenario: Auto-layout remains manual-only
- **WHEN** a user adds, connects, drags, quick-adds, imports, or edits nodes without invoking the auto-layout action
- **THEN** the editor MUST NOT trigger graph-wide auto-layout automatically

### Requirement: Auto-layout repositions the current workflow into a readable directed layout
When the auto-layout action is invoked, the editor SHALL compute new positions for the current workflow graph and apply them as a left-to-right directed arrangement without changing node identity, edge identity, or workflow connectivity.

#### Scenario: Auto-layout preserves graph meaning
- **WHEN** a user runs auto-layout on a workflow graph
- **THEN** the resulting graph SHALL preserve the same node ids and edge ids as before layout
- **AND** the source/target relationships of all existing connections MUST remain unchanged

#### Scenario: Auto-layout uses handle-aware branch placement
- **WHEN** a workflow graph contains nodes with multiple named output handles such as branch outputs
- **THEN** the computed layout MUST preserve distinct routing anchors for those handles so the resulting arrangement remains readable for each branch path

### Requirement: Auto-layout commits as one semantic history step
The editor SHALL treat one successful auto-layout run as one semantic graph mutation for undo/redo purposes.

#### Scenario: One undo reverts the full layout
- **WHEN** a user successfully runs auto-layout and then invokes undo once
- **THEN** the graph SHALL return to the exact node positions that existed immediately before the auto-layout action

#### Scenario: Redo reapplies the full layout
- **WHEN** a user undoes a successful auto-layout operation and then invokes redo once
- **THEN** the graph SHALL return to the auto-layout positions from that operation

### Requirement: Auto-layout reframes the viewport after success
After a successful auto-layout operation, the editor SHALL update the viewport so the reorganized workflow is visible to the user.

#### Scenario: Successful layout refits the graph into view
- **WHEN** auto-layout completes successfully
- **THEN** the canvas viewport SHALL be adjusted to show the reorganized graph bounds with standard editor padding

### Requirement: Auto-layout failures do not mutate the graph
If the layout engine cannot compute a valid layout, the editor MUST leave the current graph unchanged and surface the failure through existing workflow error handling.

#### Scenario: Failed layout preserves current positions
- **WHEN** auto-layout fails during layout computation
- **THEN** node positions MUST remain unchanged from their pre-layout state
- **AND** no new undo history entry SHALL be created

#### Scenario: Failed layout reports an editor error
- **WHEN** auto-layout fails during layout computation
- **THEN** the workflow editor SHALL surface an error message through the existing workflow error/status mechanism
