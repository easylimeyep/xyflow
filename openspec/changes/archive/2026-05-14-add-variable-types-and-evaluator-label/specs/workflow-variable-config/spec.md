## ADDED Requirements

### Requirement: Extractor declares persisted variable type
Extractor nodes SHALL persist a config-level variable type for the value they produce. The supported variable types SHALL be `string` and `array`, and missing variable type config SHALL normalize to `string`.

#### Scenario: Extractor defaults variable type to string
- **WHEN** an extractor node is created or imported without `config.variableType`
- **THEN** the normalized extractor config MUST include `variableType` equal to `string`

#### Scenario: Extractor edits variable type from the node UI
- **WHEN** an extractor node editor is rendered
- **THEN** a type select MUST be available alongside the Label input
- **AND** the select MUST offer `string` and `array`

#### Scenario: Extractor persists selected array type
- **WHEN** the user selects `array` for an extractor variable type
- **THEN** the extractor config MUST be updated with `key: "variableType"` and `value: "array"`

#### Scenario: Extractor rejects unsupported variable type config
- **WHEN** a config update or import payload provides an extractor `variableType` other than `string` or `array`
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Setter declares clear-before-write behavior
Setter nodes SHALL persist a boolean `clear` config flag. When `clear` is `true`, runtime consumers MUST interpret the setter as clearing the existing `variableName` value before evaluating and writing `valueExpression`.

#### Scenario: Setter defaults clear to false
- **WHEN** a setter node is created or imported without `config.clear`
- **THEN** the normalized setter config MUST include `clear` equal to `false`

#### Scenario: Setter toggles clear from the node UI
- **WHEN** the user toggles the Setter `Clear` checkbox on
- **THEN** the setter config MUST be updated with `key: "clear"` and `value: true`

#### Scenario: Setter clear true means clear before write
- **WHEN** a setter node has `config.clear` equal to `true`
- **THEN** runtime consumers MUST clear the variable named by `config.variableName` before evaluating `config.valueExpression`
- **AND** runtime consumers MUST write the evaluated result into `config.variableName` after clearing

#### Scenario: Setter rejects non-boolean clear config
- **WHEN** a config update or import payload provides a setter `clear` value that is not boolean
- **THEN** the config value MUST be rejected by the node config schema
