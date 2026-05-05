## MODIFIED Requirements

### Requirement: Evaluator boolean block accepts structured operator definitions

The evaluator boolean block SHALL resolve its operator catalog from structured operator definitions where each operator includes a stable `id`, a display `value`, and a `requiresTarget` flag.

#### Scenario: Structured operator definitions drive select options

- **WHEN** the evaluator boolean block renders with an active operator catalog
- **THEN** each operator select option MUST use the operator `id` as its stored value
- **AND** the select label shown to the user MUST come from the operator `value`

### Requirement: Evaluator boolean block preserves current defaults when no overrides are supplied

If no custom evaluator operator catalog is provided, the evaluator boolean block SHALL use the current built-in operator set and current default operator selection.

#### Scenario: Default catalog is used without runtime overrides

- **WHEN** the editor mounts without a custom evaluator operator catalog
- **THEN** a newly added evaluator condition MUST default to the current built-in equality operator
- **AND** operators that currently require a target input MUST continue showing that target input

### Requirement: Evaluator boolean block derives target input behavior from operator metadata

The evaluator boolean block MUST determine whether to render the target-value input from the active operator definition instead of from a hardcoded operator-name list.

#### Scenario: Binary operator shows target input

- **WHEN** the selected operator definition has `requiresTarget` set to `true`
- **THEN** the evaluator boolean block MUST render the target-value input for that condition

#### Scenario: Unary operator hides target input

- **WHEN** the selected operator definition has `requiresTarget` set to `false`
- **THEN** the evaluator boolean block MUST hide the target-value input for that condition

### Requirement: Evaluator boolean block remains editable when stored operators are unavailable

If an existing evaluator condition contains an operator id that is not present in the active operator catalog, the evaluator boolean block SHALL preserve that value in the UI until the user explicitly replaces it.

#### Scenario: Missing operator id does not break the select

- **WHEN** an evaluator condition contains an operator id that is absent from the active operator catalog
- **THEN** the evaluator boolean block MUST keep the current operator value selectable in the UI
- **AND** the user MUST be able to replace it with one of the active operator definitions

### Requirement: Evaluator boolean block uses native select controls for evaluator choices

The evaluator boolean block SHALL render interactive evaluator choice controls with the shared native select component used by other workflow nodes, while preserving the existing stored values and display labels.

#### Scenario: Condition operator uses native select

- **WHEN** the evaluator boolean block renders a condition operator control
- **THEN** the control MUST be a native select control
- **AND** each option value MUST remain the operator `id`
- **AND** each option label MUST remain the operator `value`

#### Scenario: Logical operator uses native select

- **WHEN** the evaluator boolean block renders the first editable logical operator between multiple conditions and `enableEvaluatorMultipleConditions` is true
- **THEN** the control MUST be a native select control
- **AND** selecting `AND` MUST store `and`
- **AND** selecting `OR` MUST store `or`

#### Scenario: Non-interactive logical separators remain badges

- **WHEN** the evaluator boolean block renders additional logical separators after the first editable separator and `enableEvaluatorMultipleConditions` is true
- **THEN** those separators MUST remain non-interactive text badges

## ADDED Requirements

### Requirement: Evaluator condition UI hides multi-condition controls by default

The evaluator boolean block SHALL hide multi-condition controls unless the mounted editor runtime enables `enableEvaluatorMultipleConditions`.

#### Scenario: Add Condition hidden when flag disabled

- **WHEN** the evaluator boolean block renders with `enableEvaluatorMultipleConditions` unset or `false`
- **THEN** the `Add Condition` button MUST NOT be rendered
- **AND** logical operator controls between conditions MUST NOT be rendered

#### Scenario: Only first condition renders when flag disabled

- **WHEN** stored evaluator config contains multiple conditions and `enableEvaluatorMultipleConditions` is unset or `false`
- **THEN** only the first condition MUST be rendered
- **AND** the full stored `conditions` array MUST remain unchanged unless the rendered condition is edited
