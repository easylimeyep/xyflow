## MODIFIED Requirements

### Requirement: Setter and Extractor variable inputs use a unified Label UX

`Setter` and `Extractor` SHALL expose their variable identifier field with the same user-facing name `Label` to keep node editing semantics consistent. Empty stored Setter variable names SHALL render as empty input values with placeholder guidance, not as committed example identifiers.

#### Scenario: Setter renders Label instead of Variable name

- **WHEN** the `setVariable` node editor is rendered
- **THEN** the variable identifier field label MUST be displayed as `Label`

#### Scenario: Setter empty Label uses placeholder guidance

- **WHEN** the `setVariable` node editor is rendered with `config.variableName` equal to an empty string
- **THEN** the Label input value MUST be empty
- **AND** placeholder text MAY be displayed as guidance
- **AND** the placeholder text MUST NOT be committed to `config.variableName` unless the user explicitly enters it

#### Scenario: Extractor renders Label as variable identifier field

- **WHEN** the `extractor` node editor is rendered
- **THEN** the variable identifier field label MUST be displayed as `Label`

### Requirement: Evaluator variable input uses unified Label UX

Evaluator nodes SHALL expose their result variable identifier field with the same user-facing name `Label` used by Setter and Extractor variable identifier fields. Empty stored Evaluator labels SHALL render as empty input values with placeholder guidance, not as committed example identifiers.

#### Scenario: Evaluator renders Label as result variable identifier field

- **WHEN** the evaluator node editor is rendered
- **THEN** a result variable identifier field label MUST be displayed as `Label`

#### Scenario: Evaluator empty Label uses placeholder guidance

- **WHEN** the evaluator node editor is rendered with `config.label` equal to an empty string
- **THEN** the Label input value MUST be empty
- **AND** placeholder text MAY be displayed as guidance
- **AND** the placeholder text MUST NOT be committed to `config.label` unless the user explicitly enters it
