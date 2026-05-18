## MODIFIED Requirements

### Requirement: Extractor declares persisted variable type
Extractor nodes SHALL persist a config-level variable type for the value they produce. The supported variable types SHALL be `string` and `array`, and missing variable type config SHALL normalize to `string`. The Extractor node editor SHALL render the variable Label and Type controls in one single-line row before Extractor-specific controls.

#### Scenario: Extractor defaults variable type to string
- **WHEN** an extractor node is created or imported without `config.variableType`
- **THEN** the normalized extractor config MUST include `variableType` equal to `string`

#### Scenario: Extractor edits variable type from the node UI
- **WHEN** an extractor node editor is rendered
- **THEN** a type select MUST be available in the same single-line row as the Label input
- **AND** the Label input MUST appear before the Type select
- **AND** the select MUST offer `string` and `array`

#### Scenario: Extractor persists selected array type
- **WHEN** the user selects `array` for an extractor variable type
- **THEN** the extractor config MUST be updated with `key: "variableType"` and `value: "array"`

#### Scenario: Extractor rejects unsupported variable type config
- **WHEN** a config update or import payload provides an extractor `variableType` other than `string` or `array`
- **THEN** the config value MUST be rejected by the node config schema

## ADDED Requirements

### Requirement: Setter declares persisted variable type
Setter nodes SHALL persist a config-level variable type for the value they produce. The supported variable types SHALL be `string` and `array`, and missing variable type config SHALL normalize to `string`. Setter variable type storage SHALL use the same `config.variableType` key as Extractor.

#### Scenario: Setter defaults variable type to string
- **WHEN** a setter node is created or imported without `config.variableType`
- **THEN** the normalized setter config MUST include `variableType` equal to `string`

#### Scenario: Setter edits variable type from the node UI
- **WHEN** a setter node editor is rendered
- **THEN** a type select MUST be available in the same single-line row as the Label input
- **AND** the Label input MUST appear before the Type select
- **AND** the select MUST offer `string` and `array`

#### Scenario: Setter persists selected array type
- **WHEN** the user selects `array` for a setter variable type
- **THEN** the setter config MUST be updated with `key: "variableType"` and `value: "array"`

#### Scenario: Setter keeps value expression as one input
- **WHEN** a setter node has `config.variableType` equal to `array`
- **THEN** the Setter `Value expression` editor MUST remain a single expression input
- **AND** the setter config MUST NOT split `valueExpression` into repeatable row values

#### Scenario: Setter rejects unsupported variable type config
- **WHEN** a config update or import payload provides a setter `variableType` other than `string` or `array`
- **THEN** the config value MUST be rejected by the node config schema
