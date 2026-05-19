## MODIFIED Requirements

### Requirement: Evaluator boolean block accepts structured operator definitions

The evaluator boolean block SHALL resolve its operator catalog from structured operator definitions grouped by left operand type. Each operator MUST include a stable `id`, a display `value`, and `allowTypes` describing the allowed right operand types. Scalar operator groups and allowed scalar right operand types SHALL use `value`; `string` MUST NOT be accepted as a group key or `allowTypes` entry.

#### Scenario: Structured operator definitions drive select options

- **WHEN** the evaluator boolean block renders with an active operator catalog
- **THEN** each operator select option MUST use the operator `id` as its stored value
- **AND** the select label shown to the user MUST come from the operator `value`
- **AND** the select options MUST come from the operator group matching the condition left operand type

#### Scenario: Operator ids are scoped by left operand type

- **WHEN** the same operator `id` exists in both the `value` and `array` operator groups
- **THEN** the evaluator boolean block MUST resolve operator metadata from the group matching the condition left operand type

#### Scenario: String operator group is rejected

- **WHEN** a runtime evaluator operator catalog provides a `string` operator group instead of `value`
- **THEN** the runtime operator catalog MUST be rejected or replaced by the default typed operator catalog

#### Scenario: String allow type is rejected

- **WHEN** a runtime evaluator operator definition includes `string` in `allowTypes`
- **THEN** that operator definition MUST be rejected

### Requirement: Evaluator boolean block derives target input behavior from operator metadata

The evaluator boolean block MUST determine whether to render the target-value input from the selected operator definition's `allowTypes` instead of from a hardcoded operator-name list or `requiresTarget` flag.

#### Scenario: Binary operator shows target input

- **WHEN** the selected operator definition has `allowTypes` containing `value` or `array`
- **THEN** the evaluator boolean block MUST render the target-value input for that condition
- **AND** the right operand type picker MUST expose only the allowed operand types from `allowTypes`

#### Scenario: Unary operator hides target input

- **WHEN** the selected operator definition has `allowTypes` equal to `["none"]`
- **THEN** the evaluator boolean block MUST hide the target-value input for that condition
- **AND** the condition config MUST omit the right operand after the user selects that operator
