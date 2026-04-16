# keyword-repeatable-toggle Specification

## Purpose
TBD - created by archiving change add-keyword-repeatable-toggle. Update Purpose after archive.
## Requirements
### Requirement: Keyword exposes a Repeatable toggle below Tokens
The system SHALL render a `Repeatable` checkbox in the `Keyword` node body directly below the `Tokens` input.

#### Scenario: Repeatable toggle is visible in keyword body
- **WHEN** a `Keyword` node is rendered on canvas
- **THEN** a checkbox labeled `Repeatable` SHALL be visible below the `Tokens` input

### Requirement: Repeatable toggle updates stored keyword config
The system SHALL persist the `Repeatable` checkbox state in `Keyword` node config as the boolean key `repeatable`.

#### Scenario: Enabling repeatable stores true
- **WHEN** a user enables the `Repeatable` checkbox on a `Keyword` node
- **THEN** the node config key `repeatable` SHALL be updated to `true`

#### Scenario: Disabling repeatable stores false
- **WHEN** a user disables the `Repeatable` checkbox on a `Keyword` node
- **THEN** the node config key `repeatable` SHALL be updated to `false`

### Requirement: Keyword defaults to non-repeatable
New `Keyword` node configs SHALL initialize with `repeatable = false`.

#### Scenario: New keyword node starts non-repeatable
- **WHEN** a new `Keyword` node is created from the registry default config
- **THEN** its config SHALL include `repeatable` with the value `false`

