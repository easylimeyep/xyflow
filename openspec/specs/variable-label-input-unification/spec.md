# variable-label-input-unification Specification

## Purpose
Define unified variable-label input behavior for Setter and Extractor nodes so naming UX and downstream variable usage are consistent.

## Requirements

### Requirement: Setter and Extractor variable inputs use a unified Label UX
`Setter` and `Extractor` SHALL expose their variable identifier field with the same user-facing name `Label` to keep node editing semantics consistent.

#### Scenario: Setter renders Label instead of Variable name
- **WHEN** the `setVariable` node editor is rendered
- **THEN** the variable identifier field label MUST be displayed as `Label`

#### Scenario: Extractor renders Label as variable identifier field
- **WHEN** the `extractor` node editor is rendered
- **THEN** the variable identifier field label MUST be displayed as `Label`

### Requirement: Variable Label input edits config variable identifier without changing node title
Editing the `Label` field in `Setter` and `Extractor` SHALL update node config variable identifier fields and MUST NOT mutate `node.data.label` (node title).

#### Scenario: Setter Label updates config.variableName only
- **WHEN** user edits `Label` in a `setVariable` node and commits the value
- **THEN** `updateNodeConfig` MUST be called with `key: "variableName"` and `node.data.label` MUST remain unchanged

#### Scenario: Extractor Label updates config.extractExpression only
- **WHEN** user edits `Label` in an `extractor` node and commits the value
- **THEN** `updateNodeConfig` MUST be called with `key: "extractExpression"` and `node.data.label` MUST remain unchanged

### Requirement: Variable Label input uses JavaScript identifier validation
`Label` inputs for `Setter` and `Extractor` SHALL enforce valid JavaScript identifiers and reject invalid values with inline validation feedback.

#### Scenario: Setter rejects invalid Label
- **WHEN** user enters an invalid JavaScript identifier in `setVariable` `Label` and commits
- **THEN** config update MUST NOT be committed and inline validation error MUST be shown

#### Scenario: Extractor rejects invalid Label
- **WHEN** user enters an invalid JavaScript identifier in `extractor` `Label` and commits
- **THEN** config update MUST NOT be committed and inline validation error MUST be shown
