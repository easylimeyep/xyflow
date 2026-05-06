# workflow-auto-layout Specification

## Purpose

Define required behavior for manual workflow graph auto-layout in the editor, including controls integration, history semantics, viewport behavior, and failure handling.

## Requirements

### Requirement: Workflow canvas exposes a manual auto-layout action

The workflow editor SHALL expose a manual auto-layout action from the workflow canvas controls so users can explicitly reorganize the current graph without leaving the canvas. Apart from the opt-in measured initial auto-layout bootstrap flow, graph-wide auto-layout SHALL remain a manual user action.

#### Scenario: Auto-layout action is available in canvas controls

- **WHEN** the workflow canvas is rendered
- **THEN** the controls area SHALL include an auto-layout action alongside the existing navigation controls

#### Scenario: Auto-layout remains manual after initialization

- **WHEN** a user adds, connects, drags, quick-adds, imports, or edits nodes after editor initialization
- **THEN** the editor MUST NOT trigger graph-wide auto-layout automatically

#### Scenario: Measured initial auto-layout is the only automatic layout exception

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"`
- **THEN** the editor MAY run one graph-wide auto-layout automatically as part of initialization
- **AND** later graph-wide auto-layout runs MUST require the manual auto-layout action unless another explicit future capability defines otherwise.

### Requirement: Auto-layout repositions the current workflow into a readable directed layout

When the auto-layout action is invoked, the editor SHALL compute new positions for the current workflow graph and apply them as a left-to-right directed arrangement without changing node identity, edge identity, workflow connectivity, or the standard curved workflow connection visual.

#### Scenario: Auto-layout preserves graph meaning

- **WHEN** a user runs auto-layout on a workflow graph
- **THEN** the resulting graph SHALL preserve the same node ids and edge ids as before layout
- **AND** the source/target relationships of all existing connections MUST remain unchanged
- **AND** connections MUST remain node-to-node and handle-aware rather than becoming edge-to-edge relationships.

#### Scenario: Auto-layout uses handle-aware evaluator placement

- **WHEN** a workflow graph contains nodes with multiple named output handles such as evaluator outputs
- **THEN** the computed layout MUST preserve distinct routing anchors for those handles so the resulting arrangement remains readable for each evaluator path
- **AND** evaluator paths that skip over a longer path SHOULD receive enough node-placement clearance to avoid visually passing under unrelated node bodies when the layout engine can provide that clearance deterministically.

#### Scenario: Auto-layout does not force routed edge rendering

- **WHEN** a user runs auto-layout on a workflow graph
- **THEN** the editor SHALL apply node position changes needed for the directed layout
- **AND** the standard workflow edge renderer SHALL continue to render curved connections from React Flow source and target handle coordinates.

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

### Requirement: Measured initial auto-layout waits for node dimensions

When measured initial auto-layout is enabled, the workflow editor SHALL mount the initial graph, wait until rendered workflow nodes have measured dimensions, and then compute the initial layout using those measured dimensions.

#### Scenario: Initial graph is measured before layout

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and an initial graph containing nodes
- **THEN** the editor SHALL render the nodes before running the initial ELK layout
- **AND** the initial ELK layout request MUST use measured node dimensions for nodes whose measurements are available.

#### Scenario: Long rendered node content affects initial placement

- **WHEN** a measured initial layout graph contains a node whose rendered height is larger than the layout fallback estimate
- **THEN** the computed initial placement SHALL account for the larger measured height
- **AND** downstream nodes SHALL NOT be placed as though the node still had only the fallback height.

#### Scenario: Empty graph does not wait indefinitely

- **WHEN** `WorkflowEditor` is mounted with `autoLayoutOnInit="after-measure"` and the current graph contains no nodes
- **THEN** the editor SHALL treat measured initial auto-layout as complete without waiting for node measurements.

### Requirement: Measured initial auto-layout uses an initialization loading state

When measured initial auto-layout is enabled and pending, the workflow editor SHALL keep the canvas measurable while preventing users from seeing or interacting with the provisional pre-layout arrangement.

#### Scenario: Loader is visible while measured initial layout is pending

- **WHEN** the editor is waiting for measurements or computing the initial measured layout
- **THEN** the editor SHALL present a loading or initializing state over the canvas
- **AND** the measured nodes MUST remain mounted in a way that allows React Flow to determine their dimensions.

#### Scenario: Loader clears after measured initial layout succeeds

- **WHEN** measured initial auto-layout completes successfully
- **THEN** the editor SHALL reveal the canvas with the measured layout applied
- **AND** the viewport SHALL be adjusted to show the measured layout bounds with standard editor padding.

#### Scenario: Loader clears after measured initial layout fails

- **WHEN** measured initial auto-layout fails
- **THEN** the editor SHALL reveal the canvas with the current graph preserved
- **AND** the editor SHALL surface the layout failure through the existing workflow error/status mechanism when available.

### Requirement: Measured initial auto-layout does not create user history

The editor SHALL apply a successful measured initial auto-layout as initialization state rather than as a user graph mutation.

#### Scenario: Initial measured layout is not undoable

- **WHEN** measured initial auto-layout completes successfully
- **THEN** the measured layout result SHALL become the current graph state
- **AND** no undo history entry SHALL be created for the provisional pre-layout graph.

#### Scenario: First undo skips initialization layout

- **WHEN** measured initial auto-layout completes successfully and the user later performs a semantic graph edit
- **THEN** invoking undo once SHALL revert the user's semantic edit
- **AND** it SHALL NOT revert the graph to the provisional pre-layout arrangement.
