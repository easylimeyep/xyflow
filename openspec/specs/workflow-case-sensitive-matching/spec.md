# workflow-case-sensitive-matching Specification

## Purpose

Define frontend authoring and persistence behavior for node-level case-sensitive matching options on keyword and evaluator nodes.

## Requirements

### Requirement: Keyword exposes a Case sensitive toggle below Tokens

The system SHALL render a `Case sensitive` checkbox in the `Keyword` node body below the `Tokens` expression-list input, grouped with node-level matching options rather than with individual token rows.

#### Scenario: Keyword case sensitive toggle is visible near repeatable

- **WHEN** a `Keyword` node is rendered on canvas
- **THEN** a checkbox labeled `Case sensitive` SHALL be visible below the `Tokens` expression-list input
- **AND** it SHALL be visually grouped with the node-level `Repeatable` option

### Requirement: Evaluator exposes a node-level Case sensitive toggle

The system SHALL render a `Case sensitive` checkbox in the `Evaluator` node body below the condition list and above condition-creation controls.

#### Scenario: Evaluator case sensitive toggle is visible below conditions

- **WHEN** an `Evaluator` node is rendered on canvas
- **THEN** a checkbox labeled `Case sensitive` SHALL be visible after the condition list
- **AND** it SHALL NOT be rendered inside an individual condition row

### Requirement: Case sensitive toggle updates stored node config

The system SHALL persist the checkbox state in `Keyword` and `Evaluator` node config as the boolean key `caseSensitive`.

#### Scenario: Enabling keyword case sensitivity stores true

- **WHEN** a user enables the `Case sensitive` checkbox on a `Keyword` node
- **THEN** the node config key `caseSensitive` SHALL be updated to `true`

#### Scenario: Disabling keyword case sensitivity stores false

- **WHEN** a user disables the `Case sensitive` checkbox on a `Keyword` node
- **THEN** the node config key `caseSensitive` SHALL be updated to `false`

#### Scenario: Enabling evaluator case sensitivity stores true

- **WHEN** a user enables the `Case sensitive` checkbox on an `Evaluator` node
- **THEN** the node config key `caseSensitive` SHALL be updated to `true`

#### Scenario: Disabling evaluator case sensitivity stores false

- **WHEN** a user disables the `Case sensitive` checkbox on an `Evaluator` node
- **THEN** the node config key `caseSensitive` SHALL be updated to `false`

### Requirement: Case sensitive defaults to false

New and legacy `Keyword` and `Evaluator` node configs SHALL default `caseSensitive` to `false` when the field is not explicitly present.

#### Scenario: New matching nodes start case insensitive

- **WHEN** a new `Keyword` or `Evaluator` node is created from registry defaults
- **THEN** its config SHALL include `caseSensitive` with the value `false`

#### Scenario: Legacy payloads without caseSensitive hydrate as false

- **WHEN** the editor imports or restores a `Keyword` or `Evaluator` node config without `caseSensitive`
- **THEN** the normalized config SHALL include `caseSensitive` with the value `false`

### Requirement: Case sensitive survives workflow roundtrips

Persistence codecs SHALL preserve `caseSensitive` for `Keyword` and `Evaluator` node configs across domain and clipboard roundtrips.

#### Scenario: Domain roundtrip preserves caseSensitive

- **WHEN** a workflow containing `Keyword` and `Evaluator` nodes with `caseSensitive` values is exported and then imported
- **THEN** each restored node config SHALL retain its original `caseSensitive` value

#### Scenario: Clipboard roundtrip preserves caseSensitive

- **WHEN** a selected subgraph containing `Keyword` and `Evaluator` nodes with `caseSensitive` values is copied and pasted
- **THEN** each pasted node config SHALL retain its original `caseSensitive` value
