# workflow-variable-config Specification

## Purpose

Define variable-producing node metadata, including Extractor variable type, Setter variable type, and Setter clear-before-write behavior.
## Requirements
### Requirement: Extractor declares persisted variable type

Extractor nodes SHALL persist a config-level variable type for the value they produce. The supported variable types SHALL be `value` and `array`, and missing variable type config SHALL normalize to `value`. The Extractor node editor SHALL render the variable Label and Type controls in one single-line row before Extractor-specific controls. The Type control SHALL use native select interaction while keeping a compact icon-style collapsed presentation.

#### Scenario: Extractor defaults variable type to value

- **WHEN** an extractor node is created or imported without `config.variableType`
- **THEN** the normalized extractor config MUST include `variableType` equal to `value`

#### Scenario: Extractor edits variable type from the node UI

- **WHEN** an extractor node editor is rendered
- **THEN** a type select MUST be available in the same single-line row as the Label input
- **AND** the Label input MUST appear before the Type select
- **AND** the select MUST offer `value` and `array`

#### Scenario: Extractor type select uses native icon control

- **WHEN** an extractor node editor is rendered
- **THEN** the Type control MUST be backed by a native select
- **AND** the collapsed control MUST present the selected variable type as an icon-sized control

#### Scenario: Extractor persists selected array type

- **WHEN** the user selects `array` for an extractor variable type
- **THEN** the extractor config MUST be updated with `key: "variableType"` and `value: "array"`

#### Scenario: Extractor persists selected value type

- **WHEN** the user selects `value` for an extractor variable type
- **THEN** the extractor config MUST be updated with `key: "variableType"` and `value: "value"`

#### Scenario: Extractor rejects string variable type config

- **WHEN** a config update or import payload provides extractor `variableType` equal to `string`
- **THEN** the config value MUST be rejected by the node config schema

#### Scenario: Extractor rejects unsupported variable type config

- **WHEN** a config update or import payload provides an extractor `variableType` other than `value` or `array`
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

### Requirement: Extractor defaults token number to one

Extractor nodes SHALL persist a numeric `tokenNumber` config value. Newly created extractor nodes MUST default `config.tokenNumber` to `1` so persisted store state matches the Extractor Token Number UI and backend export for untouched nodes.

#### Scenario: New extractor node defaults token number to one

- **WHEN** an extractor node is created from the node palette without an explicit `tokenNumber` override
- **THEN** the extractor config MUST include `tokenNumber` equal to `1`

#### Scenario: Backend export preserves default token number

- **WHEN** a workflow containing a newly created extractor node is exported for backend consumption without editing Token Number
- **THEN** the exported extractor node config MUST include `tokenNumber` equal to `1`

#### Scenario: Extractor UI matches stored default token number

- **WHEN** an extractor node editor is rendered for a node created with default config and Token Number has not been edited
- **THEN** the Token Number input MUST display `1`
- **AND** the stored extractor config MUST include `tokenNumber` equal to `1`

