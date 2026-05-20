## MODIFIED Requirements

### Requirement: Pointer tracking is isolated from non-canvas render paths
Pointer-position updates SHALL be isolated so high-frequency pointer events do not force rerenders of non-canvas UI containers or workflow node components whose graph data is unchanged.

#### Scenario: Pointer updates do not rerender palette and toolbar
- **WHEN** pointer position updates are emitted during canvas interaction
- **THEN** non-canvas containers (including palette and toolbar) MUST remain within stable rerender budget

#### Scenario: Pointer updates do not rerender unchanged workflow nodes
- **WHEN** the pointer moves over the workflow canvas without changing graph data, selection, validation, viewport, or interaction mode
- **THEN** workflow node components whose props and subscribed domain data are unchanged MUST NOT rerender solely because the pointer moved

#### Scenario: Pointer position remains non-reactive workflow data
- **WHEN** the canvas records the latest pointer flow position for paste placement
- **THEN** the update MUST NOT write to the workflow Zustand store
- **AND** the update MUST NOT notify workflow store subscribers

#### Scenario: Pointer updates are rate-limited for interaction stability
- **WHEN** pointer move frequency exceeds UI frame budget
- **THEN** pointer write path MUST apply throttling, frame-based batching, or non-reactive ref writes to preserve interaction responsiveness

### Requirement: Clipboard paste uses explicit transient placement anchors
Clipboard paste SHALL support cursor-relative placement without storing pointer coordinates as reactive workflow state.

#### Scenario: Paste uses supplied pointer anchor
- **WHEN** clipboard paste is invoked with a flow-position anchor
- **THEN** pasted workflow nodes SHALL be positioned relative to that anchor
- **AND** the anchor SHALL NOT be read from workflow store state

#### Scenario: Paste falls back when no pointer anchor exists
- **WHEN** clipboard paste is invoked without a pointer anchor
- **THEN** pasted workflow nodes SHALL use the existing viewport-based fallback anchor
