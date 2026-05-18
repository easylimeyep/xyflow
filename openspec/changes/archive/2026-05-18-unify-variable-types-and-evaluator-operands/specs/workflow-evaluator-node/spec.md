## MODIFIED Requirements

### Requirement: Evaluator node is the canonical conditional logic node

The system SHALL expose an `evaluator` workflow node kind that evaluates condition config and routes execution through named true and false outputs. Evaluator conditions SHALL use typed operand objects instead of string-only operand fields.

#### Scenario: Evaluator node definition is available

- **WHEN** workflow node definitions are resolved
- **THEN** the canonical conditional logic node MUST have kind `evaluator`
- **AND** its visible title MUST be `Evaluator`
- **AND** it MUST store condition config with `conditions` and `logicalOperator`
- **AND** each condition MUST store its left operand as a typed operand object

#### Scenario: Evaluator node exposes renamed output handles

- **WHEN** an evaluator node is rendered or used in graph edges
- **THEN** the true output handle MUST use id `evaluator-true`
- **AND** the false output handle MUST use id `evaluator-false`

### Requirement: Evaluator multi-condition editing is feature flagged

The evaluator condition editor SHALL hide multi-condition creation by default and SHALL enable it only when `enableEvaluatorMultipleConditions` is true for the mounted editor runtime.

#### Scenario: Feature flag disabled hides additional condition creation

- **WHEN** an evaluator node renders with `enableEvaluatorMultipleConditions` unset or `false`
- **THEN** the `Add Condition` button MUST NOT be rendered
- **AND** only the first stored condition MUST be rendered for editing
- **AND** additional stored conditions MUST remain preserved in node config

#### Scenario: Feature flag enabled shows multi-condition controls

- **WHEN** an evaluator node renders with `enableEvaluatorMultipleConditions` set to `true`
- **THEN** the evaluator condition editor MUST render existing multi-condition controls
- **AND** the `Add Condition` action MUST append to the existing `conditions` array using the typed operand condition format

## ADDED Requirements

### Requirement: Evaluator conditions use typed operands
Evaluator condition config SHALL represent operands as typed objects. The supported operand types SHALL be `string` and `array`. A string operand SHALL store a string value, and an array operand SHALL store an array of strings.

#### Scenario: Evaluator defaults to string operands
- **WHEN** an evaluator node is created
- **THEN** its default condition MUST include a left operand equal to `{ type: "string", value: "" }`
- **AND** its default right operand MUST be `{ type: "string", value: "" }` when the default operator requires a target

#### Scenario: Evaluator accepts string operand config
- **WHEN** a config update or import payload provides an evaluator condition operand with `type` equal to `string` and `value` equal to a string
- **THEN** the evaluator config schema MUST accept the operand

#### Scenario: Evaluator accepts array operand config
- **WHEN** a config update or import payload provides an evaluator condition operand with `type` equal to `array` and `value` equal to an array of strings
- **THEN** the evaluator config schema MUST accept the operand

#### Scenario: Evaluator rejects unsupported operand type config
- **WHEN** a config update or import payload provides an evaluator condition operand with `type` other than `string` or `array`
- **THEN** the evaluator config schema MUST reject the operand

#### Scenario: Evaluator rejects operand value that does not match its type
- **WHEN** a config update or import payload provides a string operand with a non-string value
- **THEN** the evaluator config schema MUST reject the operand
- **WHEN** a config update or import payload provides an array operand with a value that is not an array of strings
- **THEN** the evaluator config schema MUST reject the operand

### Requirement: Evaluator edits operand types independently
Evaluator condition editing SHALL allow the left and right operands to choose their operand types independently. Changing one operand type MUST NOT change the other operand type.

#### Scenario: Left operand type changes independently
- **WHEN** a user changes a condition left operand type from `string` to `array`
- **THEN** the condition left operand MUST become an array operand
- **AND** the condition right operand MUST keep its current type and value

#### Scenario: Right operand type changes independently
- **WHEN** a user changes a condition right operand type from `string` to `array`
- **THEN** the condition right operand MUST become an array operand
- **AND** the condition left operand MUST keep its current type and value

#### Scenario: Array operand changes to string operand
- **WHEN** a user changes an array operand to `string`
- **THEN** the resulting string operand value MUST equal the first array item
- **AND** the resulting string operand value MUST equal an empty string when the array has no first item

### Requirement: Evaluator array operands use repeatable free-text rows
Evaluator array operands SHALL render as repeatable text rows. Array row values SHALL allow spaces, and an empty array SHALL be valid.

#### Scenario: Array operand renders repeatable rows
- **WHEN** an evaluator condition operand has `type` equal to `array`
- **THEN** the node editor MUST render repeatable row controls for that operand
- **AND** each row MUST edit one string entry in the operand value array

#### Scenario: Array operand row allows spaces
- **WHEN** a user enters `New York value` into an evaluator array operand row
- **THEN** the operand value array MUST store `New York value`
- **AND** the editor MUST NOT reject the row because it contains spaces

#### Scenario: Array operand can be empty
- **WHEN** a user removes every row from an evaluator array operand
- **THEN** the operand value MUST be an empty array
- **AND** the evaluator config schema MUST accept the empty array operand

### Requirement: Evaluator targetless operators omit the right operand
Evaluator conditions SHALL omit `right` when the selected operator does not require a target. When the selected operator requires a target, the condition SHALL include a right typed operand.

#### Scenario: Targetless operator removes right operand
- **WHEN** a user changes a condition operator to one that does not require a target
- **THEN** the condition config MUST omit the right operand

#### Scenario: Target-required operator creates default right operand
- **WHEN** a user changes a condition operator from targetless to one that requires a target
- **THEN** the condition config MUST include a right operand
- **AND** the right operand MUST default to `{ type: "string", value: "" }`

### Requirement: Evaluator preserves existing operator and case-sensitive scope
Evaluator typed operands SHALL NOT change the available evaluator operator set. Runtime consumers SHALL continue applying existing case-sensitive comparison semantics, including comparisons involving string entries inside array operands.

#### Scenario: Operator list remains unchanged
- **WHEN** an evaluator condition editor is rendered after typed operands are introduced
- **THEN** the operator select MUST expose the configured evaluator operators without filtering by operand type

#### Scenario: Case-sensitive flag remains available
- **WHEN** an evaluator node editor is rendered after typed operands are introduced
- **THEN** the Case sensitive control MUST remain available
- **AND** changing operand types MUST NOT change `config.caseSensitive`
