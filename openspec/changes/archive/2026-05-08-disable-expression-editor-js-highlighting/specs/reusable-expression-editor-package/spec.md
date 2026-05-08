## MODIFIED Requirements

### Requirement: Expression editor highlights known template variables
The reusable expression editor SHALL visually distinguish known template variable references from surrounding literal text, and SHALL NOT apply broad JavaScript syntax highlighting to ordinary literal text.

#### Scenario: Known variable expression is highlighted
- **WHEN** the editor renders a value containing `{{ myVar }}`
- **AND** the prepared variable catalog contains a variable whose value is `myVar`
- **THEN** the `{{` and `}}` delimiters SHALL render with muted styling
- **AND** the `myVar` expression body SHALL render with accent styling

#### Scenario: Unknown variable expression body is not accented
- **WHEN** the editor renders a value containing `{{ typoVar }}`
- **AND** the prepared variable catalog does not contain a variable whose value is `typoVar`
- **THEN** the `{{` and `}}` delimiters SHALL render with muted styling
- **AND** the `typoVar` expression body SHALL NOT render with known-variable accent styling

#### Scenario: Literal text remains plain
- **WHEN** the editor renders a mixed value such as `hello {{ myVar }}`
- **THEN** the `hello` literal text SHALL render with the editor's default foreground styling
- **AND** the literal text SHALL NOT receive JavaScript syntax token styling
- **AND** the `{{ myVar }}` template reference SHALL keep its template-specific delimiter and known-variable styling

#### Scenario: Highlighting does not change editing behavior
- **WHEN** a user edits, commits, validates, autocompletes, or inserts variables in an expression field
- **THEN** highlighting SHALL NOT change persisted values, validation rules, commit reasons, autocomplete options, or variable picker behavior
