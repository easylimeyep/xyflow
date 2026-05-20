## MODIFIED Requirements

### Requirement: Setter declares persisted variable type

Setter nodes SHALL persist a config-level variable type for the value they produce. The supported variable types SHALL be `value` and `array`, and missing variable type config SHALL normalize to `value`. Setter variable type storage SHALL use the same `config.variableType` key as Extractor. The Setter node editor Type control SHALL use native select interaction while keeping a compact icon-style collapsed presentation. Setter nodes SHALL default their variable identifier `config.variableName` to an empty string.

#### Scenario: Setter defaults variable name to empty

- **WHEN** a setter node is created or imported without `config.variableName`
- **THEN** the normalized setter config MUST include `variableName` equal to an empty string
- **AND** the normalized config MUST NOT synthesize `myVar` as a stored variable name

#### Scenario: Setter defaults variable type to value

- **WHEN** a setter node is created or imported without `config.variableType`
- **THEN** the normalized setter config MUST include `variableType` equal to `value`

#### Scenario: Setter edits variable type from the node UI

- **WHEN** a setter node editor is rendered
- **THEN** a type select MUST be available in the same single-line row as the Label input
- **AND** the Label input MUST appear before the Type select
- **AND** the select MUST offer `value` and `array`

#### Scenario: Setter type select uses native icon control

- **WHEN** a setter node editor is rendered
- **THEN** the Type control MUST be backed by a native select
- **AND** the collapsed control MUST present the selected variable type as an icon-sized control

#### Scenario: Setter persists selected array type

- **WHEN** the user selects `array` for a setter variable type
- **THEN** the setter config MUST be updated with `key: "variableType"` and `value: "array"`

#### Scenario: Setter persists selected value type

- **WHEN** the user selects `value` for a setter variable type
- **THEN** the setter config MUST be updated with `key: "variableType"` and `value: "value"`

#### Scenario: Setter keeps value expression as one input

- **WHEN** a setter node has `config.variableType` equal to `array`
- **THEN** the Setter `Value expression` editor MUST remain a single expression input
- **AND** the setter config MUST NOT split `valueExpression` into repeatable row values

#### Scenario: Setter rejects string variable type config

- **WHEN** a config update or import payload provides setter `variableType` equal to `string`
- **THEN** the config value MUST be rejected by the node config schema

#### Scenario: Setter rejects unsupported variable type config

- **WHEN** a config update or import payload provides a setter `variableType` other than `value` or `array`
- **THEN** the config value MUST be rejected by the node config schema
