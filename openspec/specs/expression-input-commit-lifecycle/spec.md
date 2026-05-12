# expression-input-commit-lifecycle Specification

## Purpose
Defines the expression editor commit lifecycle for blur, Enter, live validation, external value synchronization, and variable insertion.
## Requirements
### Requirement: ExpressionInput commits value on blur
The expression editor SHALL call its commit callback with the current editor content when the CodeMirror editor loses focus, provided the current content differs from the `value` prop.

#### Scenario: Value committed on blur
- **WHEN** the user types into the expression editor and then clicks outside it
- **THEN** the commit callback is called once with the full typed value

#### Scenario: No commit when value unchanged
- **WHEN** the user focuses the expression editor without typing and then blurs
- **THEN** the commit callback is NOT called

#### Scenario: Value does not revert after fast type-and-blur
- **WHEN** the user types quickly and blurs within 200ms of the last keystroke
- **THEN** the editor continues to display the typed value after blur (no revert)

---

### Requirement: ExpressionInput commits value on Enter
The expression editor SHALL call its commit callback with the current editor content when the user presses Enter (without Shift), and SHALL blur the editor afterwards.

#### Scenario: Enter commits and blurs
- **WHEN** the user types in the expression editor and presses Enter
- **THEN** the commit callback is called with the typed value and the editor loses focus

#### Scenario: Shift+Enter does not commit
- **WHEN** the user presses Shift+Enter
- **THEN** the commit callback is NOT called and focus is retained

---

### Requirement: ExpressionInput does not call onChange on every keystroke
The expression editor SHALL NOT call its commit callback during typing (i.e., on intermediate keystrokes).

#### Scenario: No intermediate onChange during typing
- **WHEN** the user types three characters in sequence without blurring
- **THEN** the commit callback has not been called

---

### Requirement: ExpressionInput shows live validation while typing
The expression editor SHALL validate the current editor content as the user types and display errors inline, independent of the committed `value` prop.

#### Scenario: Validation error visible mid-type
- **WHEN** the user types an invalid expression template (e.g., unclosed `{{`)
- **THEN** a validation error is visible before the user blurs

---

### Requirement: ExpressionInput syncs from external value changes
The expression editor SHALL update its displayed content and internal live state when the `value` prop changes from an external source (e.g., undo/redo) while the editor is not focused.

#### Scenario: Undo restores editor content
- **WHEN** undo is triggered and `value` prop changes to a previous value
- **THEN** the editor displays the restored value

---

### Requirement: ExpressionInput preserves focused live draft across unrelated renders
The expression editor SHALL preserve the current focused editor content when the parent component re-renders without changing the committed `value` prop. Unrelated workflow node config updates MUST NOT replace the focused live editor document with an older committed value.

#### Scenario: Same committed value render keeps focused draft
- **WHEN** the user types into the expression editor without committing
- **AND** the parent component re-renders with the same committed `value` prop
- **THEN** the editor continues to display the typed uncommitted value
- **AND** the commit callback is NOT called solely because of the re-render

#### Scenario: Keyword case sensitive toggle keeps token draft
- **WHEN** the user types into a Keyword token expression row without committing
- **AND** the user toggles the Keyword `Case sensitive` checkbox
- **THEN** the checkbox state is stored in node config
- **AND** the token expression row continues to display the typed uncommitted value

#### Scenario: Unfocused editor still syncs external value
- **WHEN** the expression editor is not focused
- **AND** the committed `value` prop changes from an external source
- **THEN** the editor displays the new committed value

---

### Requirement: Variable insertion commits immediately
The expression editor SHALL call its commit callback immediately when a variable is inserted via the variable picker, without waiting for blur. Picker interaction MUST remain reliable when moving focus from the editor to the picker causes an editor blur and parent state update.

#### Scenario: Variable insertion triggers onChange
- **WHEN** the user selects a variable from the picker
- **THEN** the commit callback is called immediately with the updated expression

#### Scenario: Variable insertion survives blur commit in list row
- **WHEN** the user types `{{}}` in an expression row inside a keyword expression list and clicks a variable in the opened picker
- **THEN** the selected variable is inserted on the first click
- **THEN** the picker closes only after insertion has been committed
