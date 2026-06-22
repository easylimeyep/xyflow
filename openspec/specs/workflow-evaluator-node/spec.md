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

Evaluator nodes SHALL include a config-level result label that identifies the evaluator result for downstream expressions. Missing evaluator label config SHALL normalize to an empty string. The Evaluator Label input SHALL use placeholder text for guidance rather than storing a default result label. The Evaluator Label input SHALL allow users to clear the label and commit an empty string.

#### Scenario: Evaluator defaults result label to empty

- **WHEN** an evaluator node is created or imported without `config.label`
- **THEN** the normalized evaluator config MUST include `label` equal to an empty string
- **AND** the normalized config MUST NOT synthesize `conditionMatched` as a stored label

#### Scenario: Evaluator accepts valid result label config

- **WHEN** a config update provides evaluator `label` with a valid JavaScript identifier
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator accepts empty result label config

- **WHEN** a config update provides evaluator `label` equal to an empty string
- **THEN** the evaluator config schema MUST accept the value

#### Scenario: Evaluator Label input commits empty result label

- **WHEN** a user clears the Evaluator Label input and commits the field
- **THEN** the evaluator node config MUST be updated with `key: "label"` and `value: ""`
- **AND** the editor MUST NOT show a required-field validation error for the empty label
- **AND** the input placeholder MAY continue to show guidance without storing that placeholder text

#### Scenario: Evaluator rejects invalid non-empty result label from the node UI

- **WHEN** a user enters a non-empty evaluator Label that is not a valid JavaScript identifier and commits the field
- **THEN** the evaluator node config MUST NOT be updated with that invalid label
- **AND** the editor MUST show an invalid-identifier validation error

#### Scenario: Evaluator rejects non-string result label config

- **WHEN** a config update or import payload provides an evaluator `label` value that is not a string
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Evaluator result label is available to downstream expressions

Evaluator nodes SHALL be treated as variable-producing nodes for downstream expression variable discovery only when their result label is a valid non-empty JavaScript identifier. Clearing an evaluator result label SHALL remove the evaluator result from future variable discovery without rewriting existing downstream expression references to an empty name.

#### Scenario: Empty evaluator label is excluded from downstream variables

- **WHEN** an evaluator node with `config.label` equal to an empty string is upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include an empty variable entry
- **AND** the selected node's expression variable catalog MUST NOT include `conditionMatched` unless that value is explicitly stored in config

#### Scenario: Downstream node can reference explicit upstream evaluator label

- **WHEN** an evaluator node with `config.label` equal to `conditionMatched` is upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST include `conditionMatched`

#### Scenario: Evaluator label rename refactors downstream references

- **WHEN** evaluator `config.label` changes from `conditionMatched` to `isQualified`
- **THEN** downstream plain expression references to `conditionMatched` MUST be refactored to `isQualified`

#### Scenario: Evaluator label clear does not blank downstream references

- **WHEN** evaluator `config.label` changes from `conditionMatched` to an empty string
- **THEN** downstream plain expression references to `conditionMatched` MUST remain unchanged
- **AND** the selected node's expression variable catalog MUST NOT include `conditionMatched` for that evaluator unless that value is explicitly restored in config

#### Scenario: Non-upstream evaluator label is excluded

- **WHEN** an evaluator node is not reachable upstream of the selected node
- **THEN** the selected node's expression variable catalog MUST NOT include that evaluator label

### Requirement: Evaluator result label storage remains distinct from variable type metadata

Evaluator result label storage SHALL remain `config.label`. Evaluator nodes MUST NOT persist `config.labelType` or `config.variableType` for result label behavior. Setter and Extractor producer metadata storage MUST remain unchanged by evaluator result label editing.

#### Scenario: Evaluator label updates preserve evaluator config shape

- **WHEN** an evaluator label update is committed
- **THEN** the evaluator node config MUST store the result label at `config.label`
- **AND** the evaluator node config MUST NOT add `labelType` or `variableType`

#### Scenario: Setter and Extractor metadata storage remains unchanged

- **WHEN** evaluator label behavior is changed
- **THEN** Setter producer labels MUST continue to use `config.variableName`
- **AND** Extractor producer labels MUST continue to use `config.extractExpression`
- **AND** Setter and Extractor type metadata MUST continue to use `config.variableType`

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

### Requirement: Evaluator array operand editor uses controlled workflow state

The evaluator condition editor SHALL own array operand draft state and commit timing while rendering the array input popover through a reusable UI package component that receives plain controlled props.

#### Scenario: Array operand draft edits remain uncommitted until close

- **WHEN** a user opens an evaluator array operand popover and edits a row value
- **THEN** the evaluator node config MUST NOT be updated before the popover closes
- **AND** the open popover preview MAY reflect the draft row value

#### Scenario: Array operand draft commits on close

- **WHEN** a user closes an evaluator array operand popover after changing draft row values
- **THEN** the evaluator node config MUST be updated with an array typed operand containing the normalized draft values

#### Scenario: Reusable array input popover stays workflow agnostic

- **WHEN** the evaluator renders the array operand popover UI
- **THEN** the reusable UI component MUST receive plain string array values and callbacks
- **AND** the reusable UI component MUST NOT depend on evaluator condition types or `WorkflowTypedValue`

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

Evaluator typed operands SHALL resolve available evaluator operators from the effective left operand type. The effective left operand type SHALL be inferred from upstream variable metadata when the declared left operand type is `value` and inference is possible. Runtime consumers SHALL continue applying existing case-sensitive comparison semantics, including comparisons involving string entries inside array operands.

#### Scenario: Operator list follows declared array left operand type

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `array`
- **THEN** the operator select MUST expose the configured array evaluator operators

#### Scenario: Operator list follows inferred upstream array variable type

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **AND** the left expression resolves to a single reachable upstream variable with type `array`
- **THEN** the operator select MUST expose the configured array evaluator operators

#### Scenario: Unresolved variable falls back to value operators

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **AND** the left expression cannot be resolved to a known reachable upstream variable type
- **THEN** the operator select MUST expose the configured value evaluator operators

#### Scenario: Unresolved variable shows warning chip with tooltip

- **WHEN** an evaluator condition editor renders a condition whose left operand type is `value`
- **AND** the left expression contains an unresolved variable reference
- **THEN** the left expression input MUST render a warning chip in the top-right corner
- **AND** the chip MUST use warning styling (yellow)
- **AND** hovering the chip MUST show a tooltip explaining the variable could not be resolved

#### Scenario: Variable rename or delete reverts to value operators when unresolved

- **WHEN** a previously resolved left expression variable becomes unresolved after upstream rename or deletion
- **THEN** the operator select MUST switch to the configured value evaluator operators
- **AND** unresolved warning chip behavior MUST be applied

#### Scenario: Invalid operator after effective type flip auto-reconciles

- **WHEN** the effective left operand type changes and current operator is not present in the target operator catalog
- **THEN** the condition operator MUST be replaced with the first operator from that target catalog
- **AND** right operand reconciliation MUST follow the selected operator `allowTypes` contract

#### Scenario: Case-sensitive flag remains available

- **WHEN** an evaluator node editor is rendered after effective type inference is introduced
- **THEN** the Case sensitive control MUST remain available
- **AND** effective type inference and operator reconciliation MUST NOT change `config.caseSensitive`
