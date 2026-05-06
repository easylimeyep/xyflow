## ADDED Requirements

### Requirement: Initial graph builders remain DOM-independent

The public initial-graph builder utilities SHALL remain usable without mounting a React workflow editor, and measured initial auto-layout SHALL be provided by the editor runtime rather than by the builder utilities.

#### Scenario: ELK builder remains available outside the editor

- **WHEN** a consumer calls `createInitialGraphElk` outside a mounted React workflow editor
- **THEN** the builder SHALL continue to return an asynchronously positioned `WorkflowGraphState`
- **AND** the builder MUST NOT require rendered DOM measurements.

#### Scenario: Measured initial layout is requested through WorkflowEditor

- **WHEN** a consumer needs initial layout that accounts for rendered node dimensions
- **THEN** the consumer SHALL be able to pass a normalized initial graph to `WorkflowEditor` with `autoLayoutOnInit="after-measure"`
- **AND** the editor SHALL be responsible for waiting on rendered node measurements before computing the initial measured layout.
