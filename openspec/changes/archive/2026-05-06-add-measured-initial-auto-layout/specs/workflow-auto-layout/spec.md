## ADDED Requirements

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

## MODIFIED Requirements

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
