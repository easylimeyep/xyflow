## MODIFIED Requirements

### Requirement: Expression editor accepts prepared variable catalog
The reusable expression editor SHALL accept prepared variable options from its consumer and SHALL NOT compute available workflow variables from nodes or edges.

#### Scenario: Consumer passes variables
- **WHEN** a consumer renders the expression editor with a list of variable options
- **THEN** the editor SHALL use those options for custom variable insertion

#### Scenario: Workflow variable discovery remains outside editor package
- **WHEN** `@workspace/flow` determines variables available to a selected node
- **THEN** it SHALL compute that catalog in flow code and pass the result into the reusable editor

### Requirement: Flow migration preserves expression field behavior
Migrating workflow expression fields to the reusable package SHALL preserve the current authoring behavior for set-variable, evaluator, extractor, and keyword expression list fields, except that CodeMirror's implicit autocomplete tooltip SHALL NOT appear during normal text editing.

#### Scenario: Existing node expression fields still edit
- **WHEN** a user edits an existing workflow expression field after the migration
- **THEN** the field SHALL support the same template validation, variable picker, blur commit, Enter commit, and external value sync behavior as before

#### Scenario: Keyword expression list still inserts variables first-click
- **WHEN** a user types `{{}}` in a keyword expression row and selects a variable from the picker
- **THEN** the variable SHALL be inserted on the first selection attempt

#### Scenario: Expression editor renders a single input border
- **WHEN** a workflow expression field renders the reusable CodeMirror-backed editor
- **THEN** the editor SHALL show one visible input border around the control
- **THEN** the nested CodeMirror editor SHALL NOT add a second full control border inside the wrapper

#### Scenario: Normal token editing does not show CodeMirror autocomplete
- **WHEN** a user edits an existing expression token such as changing `{{ email }}` to `{{ emai }}` and back
- **THEN** the editor SHALL NOT render CodeMirror's autocomplete tooltip
- **AND** the custom variable picker SHALL remain closed unless its explicit trigger flow is used

#### Scenario: Custom variable picker remains the suggestion surface
- **WHEN** a user invokes the explicit variable picker flow by typing `{{}}`
- **THEN** the editor SHALL show the custom variable picker using the prepared variable catalog
- **AND** selecting a variable SHALL insert it in wrapped `{{ variable }}` format
