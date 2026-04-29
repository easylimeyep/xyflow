# expression-input-commit-lifecycle Specification

## Purpose
TBD - created by archiving change expression-input-commit-on-blur. Update Purpose after archive.
## Requirements
### Requirement: ExpressionInput commits value on blur
`ExpressionInput` SHALL call `onChange` with the current editor content when the CodeMirror editor loses focus, provided the current content differs from the `value` prop.

#### Scenario: Value committed on blur
- **WHEN** the user types into ExpressionInput and then clicks outside it
- **THEN** `onChange` is called once with the full typed value

#### Scenario: No commit when value unchanged
- **WHEN** the user focuses ExpressionInput without typing and then blurs
- **THEN** `onChange` is NOT called

#### Scenario: Value does not revert after fast type-and-blur
- **WHEN** the user types quickly and blurs within 200ms of the last keystroke
- **THEN** the editor continues to display the typed value after blur (no revert)

---

### Requirement: ExpressionInput commits value on Enter
`ExpressionInput` SHALL call `onChange` with the current editor content when the user presses Enter (without Shift), and SHALL blur the editor afterwards.

#### Scenario: Enter commits and blurs
- **WHEN** the user types in ExpressionInput and presses Enter
- **THEN** `onChange` is called with the typed value and the editor loses focus

#### Scenario: Shift+Enter does not commit
- **WHEN** the user presses Shift+Enter
- **THEN** `onChange` is NOT called and focus is retained

---

### Requirement: ExpressionInput does not call onChange on every keystroke
`ExpressionInput` SHALL NOT call `onChange` during typing (i.e., on intermediate keystrokes).

#### Scenario: No intermediate onChange during typing
- **WHEN** the user types three characters in sequence without blurring
- **THEN** `onChange` has not been called

---

### Requirement: ExpressionInput shows live validation while typing
`ExpressionInput` SHALL validate the current editor content as the user types and display errors inline, independent of the committed `value` prop.

#### Scenario: Validation error visible mid-type
- **WHEN** the user types an invalid expression template (e.g., unclosed `{{`)
- **THEN** a validation error is visible before the user blurs

---

### Requirement: ExpressionInput syncs from external value changes
`ExpressionInput` SHALL update its displayed content and internal live state when the `value` prop changes from an external source (e.g., undo/redo) while the editor is not focused.

#### Scenario: Undo restores editor content
- **WHEN** undo is triggered and `value` prop changes to a previous value
- **THEN** the editor displays the restored value

---

### Requirement: Variable insertion commits immediately
`ExpressionInput` SHALL call `onChange` immediately when a variable is inserted via the variable picker, without waiting for blur. Picker interaction MUST remain reliable when moving focus from the editor to the picker causes an editor blur and parent state update.

#### Scenario: Variable insertion triggers onChange
- **WHEN** the user selects a variable from the picker
- **THEN** `onChange` is called immediately with the updated expression

#### Scenario: Variable insertion survives blur commit in list row
- **WHEN** the user types `{{}}` in an expression row inside a keyword expression list and clicks a variable in the opened picker
- **THEN** the selected variable is inserted on the first click
- **THEN** the picker closes only after insertion has been committed
