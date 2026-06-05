## MODIFIED Requirements

### Requirement: Keyword templates persist as ordered arrays of strings

The system SHALL store `Keyword` `template` config values as ordered arrays of non-empty token strings. Empty keyword token rows SHALL remain UI-only placeholders and MUST NOT be persisted as `template` entries.

#### Scenario: Editing keyword rows updates array-backed config

- **WHEN** a user edits one or more keyword token rows with non-empty token values
- **THEN** the node config key `template` SHALL be persisted as an ordered array of those row string values

#### Scenario: Clearing the final keyword row stores an empty token array

- **WHEN** a user clears the only stored keyword token row
- **THEN** the node config key `template` SHALL be persisted as an empty array
- **AND** the `Keyword` node SHALL continue to show one empty editable token row

#### Scenario: Empty visual token rows are not persisted during row actions

- **WHEN** a `Keyword` node is rendered with no stored token values
- **AND** the user activates `Add token`
- **THEN** the node config key `template` SHALL NOT persist empty string entries
- **AND** the `Keyword` node SHALL continue to provide an empty editable token row

#### Scenario: Mixed empty and non-empty keyword rows persist only tokens

- **WHEN** a user edits keyword token rows so some rows are empty and some rows contain valid token values
- **THEN** the node config key `template` SHALL be persisted as an ordered array of the non-empty token string values
- **AND** empty rows SHALL NOT be included in the persisted array

#### Scenario: Legacy scalar template values normalize to one row

- **WHEN** the editor imports or restores a `Keyword` node whose `template` config is a single string
- **THEN** the system SHALL normalize that value to a one-item string array while preserving the original string content
