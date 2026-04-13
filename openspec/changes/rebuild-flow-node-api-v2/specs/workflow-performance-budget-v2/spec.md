## ADDED Requirements

### Requirement: Pointer tracking is isolated from non-canvas render paths
Pointer-position updates SHALL be isolated so high-frequency pointer events do not force rerenders of non-canvas UI containers.

#### Scenario: Pointer updates do not rerender palette and toolbar
- **WHEN** pointer position updates are emitted during canvas interaction
- **THEN** non-canvas containers (including palette and toolbar) MUST remain within stable rerender budget

#### Scenario: Pointer updates are rate-limited for interaction stability
- **WHEN** pointer move frequency exceeds UI frame budget
- **THEN** pointer write path MUST apply throttling or frame-based batching to preserve interaction responsiveness

### Requirement: Drag and pan interactions preserve responsiveness
Drag and pan interactions SHALL maintain stable interaction latency and MUST avoid unnecessary expensive recomputation.

#### Scenario: Drag updates avoid structural recomputation
- **WHEN** node movement updates occur during drag in progress
- **THEN** structural derived computations MUST NOT recompute unless graph structure changes

#### Scenario: Pan/viewport updates avoid non-canvas rerenders
- **WHEN** viewport position or zoom changes
- **THEN** non-canvas containers MUST NOT rerender solely due to viewport updates

### Requirement: Expression selector references are stable across non-structural updates
Expression-variable selector outputs SHALL preserve reference stability when structural graph inputs are unchanged.

#### Scenario: Position-only changes keep selector reference stable
- **WHEN** node positions change without node/edge structural changes
- **THEN** expression selector output references MUST remain stable for the same target node
