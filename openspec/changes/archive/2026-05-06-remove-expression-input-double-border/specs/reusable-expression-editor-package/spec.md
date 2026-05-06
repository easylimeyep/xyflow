## MODIFIED Requirements

### Requirement: Flow migration preserves expression field behavior
Migrating workflow expression fields to the reusable package SHALL preserve the current authoring behavior for set-variable, evaluator, extractor, and keyword expression list fields.

#### Scenario: Existing node expression fields still edit
- **WHEN** a user edits an existing workflow expression field after the migration
- **THEN** the field SHALL support the same template validation, autocomplete, variable picker, blur commit, Enter commit, and external value sync behavior as before

#### Scenario: Keyword expression list still inserts variables first-click
- **WHEN** a user types `{{}}` in a keyword expression row and selects a variable from the picker
- **THEN** the variable SHALL be inserted on the first selection attempt

#### Scenario: Expression editor renders a single input border
- **WHEN** a workflow expression field renders the reusable CodeMirror-backed editor
- **THEN** the editor SHALL show one visible input border around the control
- **THEN** the nested CodeMirror editor SHALL NOT add a second full control border inside the wrapper
