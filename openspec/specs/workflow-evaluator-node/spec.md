# workflow-evaluator-node Specification

## Purpose

TBD - created by syncing change rename-branch-to-evaluator. Update Purpose after archive.
## Requirements
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

### Requirement: Evaluator outgoing connections use named branch handles

The workflow editor SHALL prevent evaluator nodes from creating outgoing connections that do not identify one of the evaluator branch handles.

#### Scenario: Evaluator outgoing connection without branch handle is rejected

- **WHEN** a user or graph command attempts to connect from an evaluator node with `sourceHandle` unset or `null`
- **THEN** the connection MUST be rejected
- **AND** the editor graph MUST NOT store the connection

#### Scenario: Evaluator outgoing true and false branch connections are accepted

- **WHEN** a user or graph command connects from an evaluator node with `sourceHandle` equal to `evaluator-true`
- **THEN** the connection MAY be accepted if all other graph validation rules pass
- **WHEN** a user or graph command connects from an evaluator node with `sourceHandle` equal to `evaluator-false`
- **THEN** the connection MAY be accepted if all other graph validation rules pass

### Requirement: Evaluator edge insertion preserves a valid continuation branch

When an evaluator node is inserted on an existing edge, the workflow editor SHALL split the edge into valid graph connections that remain exportable to backend execution DTOs.

#### Scenario: Inserted evaluator continues through true branch

- **WHEN** an evaluator node is inserted on an existing edge
- **THEN** the upstream split edge MUST connect the original source to the inserted evaluator
- **AND** the downstream split edge MUST connect the inserted evaluator to the original target with `sourceHandle` equal to `evaluator-true`
- **AND** the inserted evaluator MUST NOT create a downstream edge with `sourceHandle` unset or `null`

#### Scenario: Inserted evaluator false branch remains available

- **WHEN** an evaluator node is inserted on an existing edge
- **THEN** the inserted evaluator's `evaluator-false` branch MUST remain unconnected unless the user explicitly connects it
- **AND** the false branch quick-add affordance MUST remain available

### Requirement: Evaluator branch quick-add reflects stored branch edges

The evaluator node UI SHALL show or hide branch quick-add affordances according to the branch handles stored on outgoing edges.

#### Scenario: Connected true branch hides true quick-add

- **WHEN** an evaluator node has an outgoing edge with `sourceHandle` equal to `evaluator-true`
- **THEN** the true branch quick-add affordance MUST NOT be shown

#### Scenario: Unconnected false branch shows false quick-add

- **WHEN** an evaluator node has no outgoing edge with `sourceHandle` equal to `evaluator-false`
- **THEN** the false branch quick-add affordance MUST be shown

### Requirement: Evaluator exposes a persisted result label

Evaluator nodes SHALL include a config-level result label that identifies the evaluator result for downstream expressions. Missing evaluator label config SHALL normalize to `conditionMatched`.

#### Scenario: Evaluator defaults result label

- **WHEN** an evaluator node is created or imported without `config.label`
- **THEN** the normalized evaluator config MUST include `label` equal to `conditionMatched`

#### Scenario: Evaluator accepts valid result label config

- **WHEN** a config update provides evaluator `label` with a valid JavaScript identifier
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator rejects non-string result label config

- **WHEN** a config update or import payload provides an evaluator `label` value that is not a string
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Evaluator result label is available to downstream expressions

Evaluator nodes SHALL be treated as variable-producing nodes for downstream expression variable discovery when their result label is a valid JavaScript identifier.

#### Scenario: Downstream node can reference upstream evaluator label

- **WHEN** an evaluator node with `config.label` equal to `conditionMatched` is upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST include `conditionMatched`

#### Scenario: Evaluator label rename refactors downstream references

- **WHEN** evaluator `config.label` changes from `conditionMatched` to `isQualified`
- **THEN** downstream plain expression references to `conditionMatched` MUST be refactored to `isQualified`

#### Scenario: Non-upstream evaluator label is excluded

- **WHEN** an evaluator node is not reachable upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include that evaluator label

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

Evaluator condition editing SHALL allow the left and right operands to choose operand types according to the selected operator catalog. Changing the right operand type MUST NOT change the left operand type. Changing the left operand type MUST reconcile the selected operator and right operand against the operator group for the new left operand type.

#### Scenario: Left operand type change reconciles operator and right operand

- **WHEN** a user changes a condition left operand type from `string` to `array`
- **THEN** the condition left operand MUST become an array operand
- **AND** the condition operator MUST remain unchanged only if that operator exists in the array operator group
- **AND** the condition operator MUST change to the first array operator when the previous operator does not exist in the array operator group
- **AND** the condition right operand MUST be reconciled from the selected array operator's `allowTypes`

#### Scenario: Right operand type changes independently

- **WHEN** a user changes a condition right operand type from `string` to `array`
- **THEN** the condition right operand MUST become an array operand
- **AND** the condition left operand MUST keep its current type and value
- **AND** the condition operator MUST keep its current value

#### Scenario: Right operand type choices are restricted by operator

- **WHEN** a selected operator allows only `string` right operands
- **THEN** the right operand type picker MUST NOT offer `array`
- **WHEN** a selected operator allows only `array` right operands
- **THEN** the right operand type picker MUST NOT offer `string`

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

Evaluator conditions SHALL omit `right` when the selected operator has `allowTypes` equal to `["none"]`. When the selected operator allows `string` or `array`, the condition SHALL include a right typed operand whose type is allowed by that operator.

#### Scenario: Targetless operator removes right operand

- **WHEN** a user changes a condition operator to one with `allowTypes` equal to `["none"]`
- **THEN** the condition config MUST omit the right operand

#### Scenario: Target-required operator creates default right operand

- **WHEN** a user changes a condition operator from targetless to one that allows `string` or `array`
- **THEN** the condition config MUST include a right operand
- **AND** the right operand MUST default to an empty operand using the first allowed operand type in `allowTypes`

#### Scenario: Incompatible right operand is recreated

- **WHEN** a user changes a condition operator and the existing right operand type is not included in the new operator's `allowTypes`
- **THEN** the condition right operand MUST be replaced with an empty operand using the first allowed operand type in `allowTypes`

### Requirement: Evaluator preserves existing operator and case-sensitive scope

Evaluator typed operands SHALL resolve available evaluator operators from the active left operand type. Runtime consumers SHALL continue applying existing case-sensitive comparison semantics, including comparisons involving string entries inside array operands.

#### Scenario: Operator list follows left operand type

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `string`
- **THEN** the operator select MUST expose the configured string evaluator operators
- **WHEN** an evaluator condition editor renders a condition whose left operand type is `array`
- **THEN** the operator select MUST expose the configured array evaluator operators

#### Scenario: Case-sensitive flag remains available

- **WHEN** an evaluator node editor is rendered after type-aware operators are introduced
- **THEN** the Case sensitive control MUST remain available
- **AND** changing operand types MUST NOT change `config.caseSensitive`

