## MODIFIED Requirements

### Requirement: Workflow editor runtime exposes evaluator operator overrides

The `WorkflowEditor` runtime API SHALL allow consumers to provide evaluator boolean operator definitions for the mounted editor instance as a typed catalog keyed by left operand type, and all descendant editor parts MUST resolve evaluator operator behavior from that mounted runtime.

#### Scenario: Consumer provides custom evaluator operators

- **WHEN** a consumer renders `WorkflowEditor` with `runtime.evaluator.operators`
- **THEN** the provided operator catalog MUST include `string` and `array` operator groups
- **AND** the mounted editor instance SHALL make that typed operator catalog available to descendant evaluator boolean blocks
- **AND** the custom catalog MUST be isolated to that mounted editor instance

#### Scenario: Consumer omits evaluator operators

- **WHEN** a consumer renders `WorkflowEditor` without `runtime.evaluator.operators`
- **THEN** the mounted editor instance SHALL use the built-in typed evaluator operator catalog
- **AND** the editor MUST preserve the current default boolean-block behavior through the built-in `string` and `array` operator groups

#### Scenario: Flat evaluator operator arrays are not supported

- **WHEN** a consumer provides `runtime.evaluator.operators` as a flat operator array
- **THEN** the runtime MUST NOT treat that array as a custom evaluator operator catalog
- **AND** the mounted editor instance MUST use the built-in typed evaluator operator catalog
