## MODIFIED Requirements

### Requirement: Workflow editor runtime exposes evaluator operator overrides

The `WorkflowEditor` runtime API SHALL allow consumers to provide evaluator boolean operator definitions for the mounted editor instance, and all descendant editor parts MUST resolve evaluator operator behavior from that mounted runtime.

#### Scenario: Consumer provides custom evaluator operators

- **WHEN** a consumer renders `WorkflowEditor` with `runtime.evaluator.operators`
- **THEN** the mounted editor instance SHALL make that operator catalog available to descendant evaluator boolean blocks
- **AND** the custom catalog MUST be isolated to that mounted editor instance

#### Scenario: Consumer omits evaluator operators

- **WHEN** a consumer renders `WorkflowEditor` without `runtime.evaluator.operators`
- **THEN** the mounted editor instance SHALL use the built-in evaluator operator catalog
- **AND** the editor MUST preserve the current default boolean-block behavior

## ADDED Requirements

### Requirement: Workflow editor runtime exposes evaluator condition feature flags

The `WorkflowEditor` runtime API SHALL expose `enableEvaluatorMultipleConditions` as a per-mounted-editor feature flag that controls evaluator multi-condition editing.

#### Scenario: Consumer omits evaluator multiple-condition flag

- **WHEN** a consumer renders `WorkflowEditor` without `runtime.enableEvaluatorMultipleConditions`
- **THEN** the mounted editor instance MUST treat evaluator multiple-condition editing as disabled

#### Scenario: Consumer enables evaluator multiple-condition flag

- **WHEN** a consumer renders `WorkflowEditor` with `runtime.enableEvaluatorMultipleConditions` set to `true`
- **THEN** descendant evaluator nodes MUST expose multi-condition editing controls for that mounted editor instance
