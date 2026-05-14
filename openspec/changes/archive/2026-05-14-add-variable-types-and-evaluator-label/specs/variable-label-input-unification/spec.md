## ADDED Requirements

### Requirement: Evaluator variable input uses unified Label UX
Evaluator nodes SHALL expose their result variable identifier field with the same user-facing name `Label` used by Setter and Extractor variable identifier fields.

#### Scenario: Evaluator renders Label as result variable identifier field
- **WHEN** the evaluator node editor is rendered
- **THEN** a result variable identifier field label MUST be displayed as `Label`

### Requirement: Evaluator Label edits config variable identifier without changing node title
Editing the `Label` field in an Evaluator SHALL update the evaluator config variable identifier field and MUST NOT mutate `node.data.label`.

#### Scenario: Evaluator Label updates config.label only
- **WHEN** user edits `Label` in an evaluator node and commits the value
- **THEN** `updateNodeConfig` MUST be called with `key: "label"`
- **AND** `node.data.label` MUST remain unchanged

### Requirement: Evaluator Label input uses JavaScript identifier validation
Evaluator `Label` input SHALL enforce valid JavaScript identifiers and reject invalid values with inline validation feedback.

#### Scenario: Evaluator rejects invalid Label
- **WHEN** user enters an invalid JavaScript identifier in evaluator `Label` and commits
- **THEN** config update MUST NOT be committed
- **AND** inline validation error MUST be shown
