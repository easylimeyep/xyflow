## Purpose

Define the JSON Setter node: a variable-producing node for JSON flows that mirrors the Setter and
adds a backend-interpreted `appendInput` flag.

## ADDED Requirements

### Requirement: JSON Setter is a built-in node kind

The package SHALL ship a built-in node kind `jsonSetter` titled "JSON Setter" in the `data`
category. It SHALL be part of the built-in definitions (with and without renderers) and SHALL be
exported by name from the nodes subpath. Every built-in node kind whose allowed targets include
`setVariable` SHALL also allow `jsonSetter` as a target. `jsonSetter` SHALL allow the same targets as
`setVariable`.

#### Scenario: JSON Setter is available from the built-ins

- **WHEN** an editor is created with the built-in definitions
- **THEN** a node of kind `jsonSetter` MUST be creatable from the palette
- **AND** `jsonSetter` MUST be importable by name from the nodes subpath

#### Scenario: Upstream nodes can connect to JSON Setter

- **WHEN** the user connects an output of a built-in node that may target `setVariable` to a
  `jsonSetter` node
- **THEN** the connection MUST be accepted

#### Scenario: JSON Setter connects to the same targets as Setter

- **WHEN** the user connects a `jsonSetter` output to a node kind that `setVariable` may target
- **THEN** the connection MUST be accepted

### Requirement: JSON Setter mirrors Setter config

A `jsonSetter` node SHALL persist `variableName` (string, default empty), `variableType` (`value`
or `array`, default `value`), `valueExpression` (string, default empty) and `clear` (boolean,
default `false`), with the same validation, variable declaration, rename and expression-dependency
behaviour as the Setter. Its node editor SHALL offer the same Label, Type, Value expression and
Clear controls as the Setter.

#### Scenario: JSON Setter defaults

- **WHEN** a `jsonSetter` node is created or imported without config
- **THEN** its normalized config MUST be `variableName: ""`, `variableType: "value"`,
  `valueExpression: ""`, `clear: false`, `appendInput: false`

#### Scenario: JSON Setter declares its variable

- **WHEN** a `jsonSetter` node has a valid identifier in `variableName`
- **THEN** downstream expressions MUST see a variable with that name and the node's
  `variableType`

#### Scenario: JSON Setter rejects invalid Setter-equivalent config

- **WHEN** a config update or import payload provides a `variableType` other than `value` or
  `array`, or a non-boolean `clear`
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: JSON Setter declares appendInput flag

A `jsonSetter` node SHALL persist a boolean `appendInput` config flag, default `false`. The node
editor SHALL render an "Append input" checkbox bound to it. The editor SHALL NOT interpret the
flag. It SHALL keep the flag through history, copy/paste, persistence and backend export (strict
and draft), where the flag appears in the exported node's `config`.

#### Scenario: Toggle appendInput from the node UI

- **WHEN** the user toggles the JSON Setter "Append input" checkbox on
- **THEN** the node config MUST be updated with `key: "appendInput"` and `value: true`

#### Scenario: Toggle appendInput off

- **WHEN** the user toggles a checked "Append input" checkbox off
- **THEN** the node config MUST be updated with `key: "appendInput"` and `value: false`

#### Scenario: appendInput reaches backend export

- **WHEN** a workflow containing a `jsonSetter` with `appendInput: true` is exported for the
  backend
- **THEN** the exported node MUST have `kind: "jsonSetter"` and `config.appendInput` equal to
  `true`

#### Scenario: JSON Setter rejects non-boolean appendInput

- **WHEN** a config update or import payload provides an `appendInput` value that is not boolean
- **THEN** the config value MUST be rejected by the node config schema

### Requirement: Setter is unaffected by appendInput

The `setVariable` node SHALL NOT gain an `appendInput` config key or control.

#### Scenario: Setter has no appendInput

- **WHEN** a `setVariable` node is created
- **THEN** its config MUST NOT contain `appendInput`
- **AND** its editor MUST NOT render an "Append input" checkbox

#### Scenario: Setter rejects appendInput config

- **WHEN** a config update provides `appendInput` for a `setVariable` node
- **THEN** the config value MUST be rejected by the node config schema
