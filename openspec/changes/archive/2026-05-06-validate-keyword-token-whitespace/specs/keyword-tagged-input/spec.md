## Modified Requirements

### Requirement: Each keyword token row is a full expression input

Each `Keyword` token row SHALL preserve the same expression authoring behavior as the standard `ExpressionInput` while enforcing that the row represents a single token value.

#### Scenario: Token row validates expression syntax

- **WHEN** a user types an invalid template into any keyword token row
- **THEN** that row SHALL surface expression validation feedback

#### Scenario: Token row supports variable autocomplete

- **WHEN** a user invokes autocomplete from any keyword token row
- **THEN** the row SHALL offer the same expression variable suggestions available to other expression inputs

#### Scenario: Literal token rows reject whitespace

- **WHEN** a user types or pastes a literal token value containing whitespace into a keyword token row
- **THEN** the row SHALL surface validation feedback
- **AND** the node config SHALL NOT persist the whitespace-bearing token value as a new edit

#### Scenario: Variable expression token rows remain allowed

- **WHEN** a user enters a single variable expression token such as `{{ $input.item.json.email }}`
- **THEN** the row SHALL accept the value
- **AND** the node config SHALL persist that row as one token entry

#### Scenario: Mixed literal and variable token rows reject whitespace

- **WHEN** a user enters a value such as `email {{ $input.item.json.email }}` into a keyword token row
- **THEN** the row SHALL surface validation feedback
- **AND** the node config SHALL NOT persist the mixed whitespace-bearing token value as a new edit
