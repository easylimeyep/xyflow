## MODIFIED Requirements

### Requirement: Evaluator edits operand types independently

Evaluator condition editing SHALL allow the left and right operands to choose operand types according to the selected operator catalog. Changing the right operand type MUST NOT change the left operand type. Changing the left operand type MUST reconcile the selected operator and right operand against the operator group for the new left operand type. Operand type controls SHALL use native select interaction while keeping a compact icon-style collapsed presentation.

#### Scenario: Left operand type change reconciles operator and right operand

- **WHEN** a user changes a condition left operand type from `value` to `array`
- **THEN** the condition left operand MUST become an array operand
- **AND** the condition operator MUST remain unchanged only if that operator exists in the array operator group
- **AND** the condition operator MUST change to the first array operator when the previous operator does not exist in the array operator group
- **AND** the condition right operand MUST be reconciled from the selected array operator's `allowTypes`

#### Scenario: Right operand type changes independently

- **WHEN** a user changes a condition right operand type from `value` to `array`
- **THEN** the condition right operand MUST become an array operand
- **AND** the condition left operand MUST keep its current type and value
- **AND** the condition operator MUST keep its current value

#### Scenario: Right operand type choices are restricted by operator

- **WHEN** a selected operator allows only `value` right operands
- **THEN** the right operand type picker MUST NOT offer `array`
- **WHEN** a selected operator allows only `array` right operands
- **THEN** the right operand type picker MUST NOT offer `value`

#### Scenario: Operand type controls use native icon selects

- **WHEN** an evaluator condition editor renders left and right operand type controls
- **THEN** each operand type control MUST be backed by a native select
- **AND** each collapsed operand type control MUST present the selected operand type as an icon-sized control

#### Scenario: Array operand changes to value operand

- **WHEN** a user changes an array operand to `value`
- **THEN** the resulting value operand payload MUST equal the first array item
- **AND** the resulting value operand payload MUST equal an empty string when the array has no first item
