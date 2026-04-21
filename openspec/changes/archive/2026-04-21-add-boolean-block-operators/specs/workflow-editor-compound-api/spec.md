## ADDED Requirements

### Requirement: Workflow editor runtime exposes branch operator overrides
The `WorkflowEditor` runtime API SHALL allow consumers to provide branch boolean operator definitions for the mounted editor instance, and all descendant editor parts MUST resolve branch operator behavior from that mounted runtime.

#### Scenario: Consumer provides custom branch operators
- **WHEN** a consumer renders `WorkflowEditor` with `runtime.branch.operators`
- **THEN** the mounted editor instance SHALL make that operator catalog available to descendant branch boolean blocks
- **AND** the custom catalog MUST be isolated to that mounted editor instance

#### Scenario: Consumer omits branch operators
- **WHEN** a consumer renders `WorkflowEditor` without `runtime.branch.operators`
- **THEN** the mounted editor instance SHALL use the built-in branch operator catalog
- **AND** the editor MUST preserve the current default boolean-block behavior
