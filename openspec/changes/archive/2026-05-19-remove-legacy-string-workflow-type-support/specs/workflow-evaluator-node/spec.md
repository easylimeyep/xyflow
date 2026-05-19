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
