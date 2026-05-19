## MODIFIED Requirements

### Requirement: Evaluator conditions use typed operands

Evaluator condition config SHALL represent operands as typed objects. The supported operand types SHALL be `value` and `array`. A value operand SHALL store a JavaScript string value, and an array operand SHALL store an array of JavaScript strings.

#### Scenario: Evaluator defaults to value operands

- **WHEN** an evaluator node is created
- **THEN** its default condition MUST include a left operand equal to `{ type: "value", value: "" }`
- **AND** its default right operand MUST be `{ type: "value", value: "" }` when the default operator requires a target

#### Scenario: Evaluator accepts value operand config

- **WHEN** a config update or import payload provides an evaluator condition operand with `type` equal to `value` and `value` equal to a JavaScript string
- **THEN** the evaluator config schema MUST accept the operand

#### Scenario: Evaluator accepts array operand config

- **WHEN** a config update or import payload provides an evaluator condition operand with `type` equal to `array` and `value` equal to an array of JavaScript strings
- **THEN** the evaluator config schema MUST accept the operand

#### Scenario: Evaluator rejects string operand type config

- **WHEN** a config update or import payload provides an evaluator condition operand with `type` equal to `string`
- **THEN** the evaluator config schema MUST reject the operand

#### Scenario: Evaluator rejects unsupported operand type config

- **WHEN** a config update or import payload provides an evaluator condition operand with `type` other than `value` or `array`
- **THEN** the evaluator config schema MUST reject the operand

#### Scenario: Evaluator rejects operand value that does not match its type

- **WHEN** a config update or import payload provides a value operand with a non-string value
- **THEN** the evaluator config schema MUST reject the operand
- **WHEN** a config update or import payload provides an array operand with a value that is not an array of JavaScript strings
- **THEN** the evaluator config schema MUST reject the operand

### Requirement: Evaluator edits operand types independently

Evaluator condition editing SHALL allow the left and right operands to choose operand types according to the selected operator catalog. Changing the right operand type MUST NOT change the left operand type. Changing the left operand type MUST reconcile the selected operator and right operand against the operator group for the new left operand type.

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

#### Scenario: Array operand changes to value operand

- **WHEN** a user changes an array operand to `value`
- **THEN** the resulting value operand payload MUST equal the first array item
- **AND** the resulting value operand payload MUST equal an empty string when the array has no first item

### Requirement: Evaluator targetless operators omit the right operand

Evaluator conditions SHALL omit `right` when the selected operator has `allowTypes` equal to `["none"]`. When the selected operator allows `value` or `array`, the condition SHALL include a right typed operand whose type is allowed by that operator.

#### Scenario: Targetless operator removes right operand

- **WHEN** a user changes a condition operator to one with `allowTypes` equal to `["none"]`
- **THEN** the condition config MUST omit the right operand

#### Scenario: Target-required operator creates default right operand

- **WHEN** a user changes a condition operator from targetless to one that allows `value` or `array`
- **THEN** the condition config MUST include a right operand
- **AND** the right operand MUST default to an empty operand using the first allowed operand type in `allowTypes`

#### Scenario: Incompatible right operand is recreated

- **WHEN** a user changes a condition operator and the existing right operand type is not included in the new operator's `allowTypes`
- **THEN** the condition right operand MUST be replaced with an empty operand using the first allowed operand type in `allowTypes`

### Requirement: Evaluator preserves existing operator and case-sensitive scope

Evaluator typed operands SHALL resolve available evaluator operators from the active left operand type. Runtime consumers SHALL continue applying existing case-sensitive comparison semantics, including comparisons involving JavaScript string entries inside array operands.

#### Scenario: Operator list follows left operand type

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **THEN** the operator select MUST expose the configured value evaluator operators
- **WHEN** an evaluator condition editor renders a condition whose left operand type is `array`
- **THEN** the operator select MUST expose the configured array evaluator operators

#### Scenario: Case-sensitive flag remains available

- **WHEN** an evaluator node editor is rendered after value operands are introduced
- **THEN** the Case sensitive control MUST remain available
- **AND** changing operand types MUST NOT change `config.caseSensitive`
