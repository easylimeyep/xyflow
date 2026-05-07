## MODIFIED Requirements

### Requirement: Drag and pan interactions preserve responsiveness
Drag and pan interactions SHALL maintain stable interaction latency and MUST avoid unnecessary expensive recomputation.

#### Scenario: Drag updates avoid structural recomputation
- **WHEN** node movement updates occur during drag in progress
- **THEN** structural derived computations MUST NOT recompute unless graph structure changes

#### Scenario: Position-only node changes skip expression dependency work
- **WHEN** React Flow emits only node position changes
- **THEN** the workflow store SHALL update node positions without rebuilding expression dependency graphs, structural signatures, or expression catalog cache entries
- **AND** expression dependency/cache work SHALL remain available for node/edge/config changes that can affect expression variables

#### Scenario: Sustained large-graph drag remains inside performance budget
- **WHEN** a representative large workflow receives a sustained burst of node drag position updates
- **THEN** the average transient update latency SHALL remain within the frame-safe performance budget used by workflow store performance tests
- **AND** the drag SHALL commit at most one undoable history entry when the drag ends

#### Scenario: Pan/viewport updates avoid non-canvas rerenders
- **WHEN** viewport position or zoom changes
- **THEN** non-canvas containers MUST NOT rerender solely due to viewport updates

### Requirement: Expression selector references are stable across non-structural updates
Expression-variable selector outputs SHALL preserve reference stability when structural graph inputs are unchanged.

#### Scenario: Position-only changes keep selector reference stable
- **WHEN** node positions change without node/edge structural changes
- **THEN** expression selector output references MUST remain stable for the same target node

#### Scenario: Position-only changes keep expression structural version stable
- **WHEN** node positions change without node/edge/config semantic changes
- **THEN** expression structural version MUST remain unchanged
- **AND** existing expression catalog cache references MUST remain reusable
