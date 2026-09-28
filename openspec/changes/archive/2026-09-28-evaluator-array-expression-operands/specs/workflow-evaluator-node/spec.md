## MODIFIED Requirements

### Requirement: Evaluator array operands use repeatable free-text rows

Evaluator array operands SHALL render as repeatable expression rows. Each row SHALL edit one expression template string with the same variable autocomplete and variable rendering as an evaluator value operand. A row MAY contain literal text, a single variable reference, or literal text mixed with variable references. Array row values SHALL allow spaces, and an empty array SHALL be valid. The stored array operand value SHALL remain an array of JavaScript strings.

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

#### Scenario: Array operand row offers variable autocomplete

- **WHEN** a user types `{{` into an evaluator array operand row
- **THEN** the row MUST offer the same reachable upstream variables that an evaluator value operand offers

#### Scenario: Array operand row stores a variable reference as a template string

- **WHEN** a user inserts the variable `city` into an evaluator array operand row
- **THEN** the operand value array MUST store that row as the template string `{{ city }}`

#### Scenario: Array operand row stores mixed text

- **WHEN** a user enters `prefix-` followed by the variable `id` into an evaluator array operand row
- **THEN** the operand value array MUST store that row as a single template string combining the literal text and the `{{ id }}` reference

#### Scenario: Array variable row is stored without expansion

- **WHEN** a row references a variable whose upstream type is `array`
- **THEN** the editor MUST store the row as a single template string
- **AND** the editor MUST NOT expand, flatten, or reject the row

### Requirement: Evaluator array operand editor uses controlled workflow state

The evaluator condition editor SHALL own array operand draft state and commit timing while rendering the array input popover through a reusable UI package component that receives plain controlled props. The reusable component SHALL accept a row-render slot through which the evaluator supplies its row editor, and SHALL fall back to a plain text row when no slot is provided.

#### Scenario: Array operand draft edits remain uncommitted until close

- **WHEN** a user opens an evaluator array operand popover and edits a row value
- **THEN** the evaluator node config MUST NOT be updated before the popover closes
- **AND** the open popover preview MAY reflect the draft row value

#### Scenario: Array operand draft commits on close

- **WHEN** a user closes an evaluator array operand popover after changing draft row values
- **THEN** the evaluator node config MUST be updated with an array typed operand containing the normalized draft values

#### Scenario: Closing the popover keeps an in-progress row edit

- **WHEN** a user types into an array operand row and closes the popover while that row still has focus
- **THEN** the committed array operand MUST include the text typed into that row

#### Scenario: Reusable array input popover stays workflow agnostic

- **WHEN** the evaluator renders the array operand popover UI
- **THEN** the reusable UI component MUST receive plain string array values and callbacks
- **AND** the reusable UI component MUST NOT depend on evaluator condition types or `WorkflowTypedValue`

#### Scenario: Reusable array input popover falls back to plain text rows

- **WHEN** the reusable array input popover is rendered without a row-render slot
- **THEN** each row MUST render as a plain text input editing one string entry

#### Scenario: Array operand popover content may exceed the trigger width

- **WHEN** an evaluator array operand popover opens from a trigger narrower than the popover content
- **THEN** the popover content MUST NOT be constrained to the trigger width

## ADDED Requirements

### Requirement: Evaluator array operand preview distinguishes variable rows

The closed array operand trigger SHALL preview non-empty rows as badges. A row whose entire value is a single variable reference SHALL render as a variable badge that is visually distinct from a literal badge.

#### Scenario: Variable row previews as a variable badge

- **WHEN** an array operand contains the rows `Moscow` and `{{ city }}`
- **THEN** the trigger preview MUST render `Moscow` as a literal badge
- **AND** the trigger preview MUST render `{{ city }}` as a variable badge with distinct styling

#### Scenario: Mixed-text row previews as a literal badge

- **WHEN** an array operand contains the row `prefix-{{ id }}`
- **THEN** the trigger preview MUST render that row as a literal badge showing its text

### Requirement: Evaluator operands warn about unresolved variables

Every user-editable evaluator operand SHALL warn when it references a variable that cannot be resolved. A value is an unresolved reference when its entire content is a single variable reference and that variable is not present among reachable upstream variables. The warning SHALL apply to left and right operands, and to value operands and each array operand row. Only the left value operand's resolution SHALL influence operator selection; warnings on the right operand and on array rows SHALL NOT change operators or operand types.

#### Scenario: Right value operand shows unresolved warning

- **WHEN** an evaluator condition right operand has `type` equal to `value` and value `{{ missing }}`
- **AND** no reachable upstream node provides the variable `missing`
- **THEN** the right operand input MUST render the unresolved warning chip with a tooltip naming `{{ missing }}`

#### Scenario: Unresolved array row marks its preview badge

- **WHEN** an evaluator array operand, on either side, contains the row `{{ missing }}`
- **AND** no reachable upstream node provides the variable `missing`
- **THEN** that row's preview badge MUST include a small warning icon
- **AND** hovering the badge MUST show a tooltip explaining that `{{ missing }}` could not be resolved from upstream nodes

#### Scenario: Unresolved array row is marked inside the open popover

- **WHEN** an open array operand popover shows the row `{{ missing }}`
- **AND** no reachable upstream node provides the variable `missing`
- **THEN** that row MUST render a warning indicator with the same tooltip

#### Scenario: Resolved or mixed rows show no warning

- **WHEN** an array operand row is a literal, a mixed-text template, or a single reference to a reachable upstream variable
- **THEN** that row MUST NOT show an unresolved warning

#### Scenario: Right operand warning does not change operators

- **WHEN** a right operand or array row shows an unresolved warning
- **THEN** the condition operator and the operand types MUST remain unchanged

### Requirement: Evaluator condition operands follow variable renames

When a variable is renamed, references to it inside evaluator and JSON evaluator condition operands SHALL be rewritten to the new name. This SHALL cover left and right operands, value operands, and every array operand row. Upstream operands carry no value and SHALL be left untouched.

#### Scenario: Rename rewrites a value operand reference

- **WHEN** a condition left operand has value `{{ city }}` and the variable `city` is renamed to `town`
- **THEN** the left operand value MUST become `{{ town }}`

#### Scenario: Rename rewrites array operand rows

- **WHEN** a condition right operand is an array containing `Moscow`, `{{ city }}`, and `prefix-{{ city }}`
- **AND** the variable `city` is renamed to `town`
- **THEN** the array MUST become `Moscow`, `{{ town }}`, and `prefix-{{ town }}`

#### Scenario: Rename leaves unrelated conditions untouched

- **WHEN** a variable is renamed and no condition operand references it
- **THEN** the evaluator node config MUST remain unchanged
