## MODIFIED Requirements

### Requirement: Keyword renders tokens as an expression list

The system SHALL render the `Keyword` node `Tokens` control as a custom list of full `ExpressionInput` rows instead of a single scalar input. Rendering the token list SHALL derive visible rows from committed keyword config plus local live edits without copying committed props into local component state through a synchronization effect.

#### Scenario: Keyword shows one expression row by default

- **WHEN** a `Keyword` node is rendered with no stored token values
- **THEN** the node SHALL show exactly one empty `ExpressionInput` row in the `Tokens` section

#### Scenario: Keyword rehydrates all stored token rows

- **WHEN** a `Keyword` node is rendered with stored token values
- **THEN** the node SHALL render one `ExpressionInput` row for each stored token string in order

#### Scenario: Keyword rerenders do not mirror props into draft state

- **WHEN** a `Keyword` token list rerenders repeatedly with unchanged committed token content
- **THEN** the token list SHALL NOT enqueue state updates solely to synchronize committed props into local draft rows
- **AND** rendering SHALL remain stable during unrelated canvas updates such as node dragging

### Requirement: Each keyword token row is a full expression input

Each `Keyword` token row SHALL preserve the same expression authoring behavior as the standard `ExpressionInput` while enforcing that the row represents a single token value. Live validation MAY use local ephemeral state, but committed workflow config SHALL remain the source of truth for saved token rows.

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

#### Scenario: External committed changes replace stale live drafts

- **WHEN** the committed keyword token array changes because of undo, import, add, remove, or another config update
- **THEN** stale local live token drafts SHALL NOT override the new committed token rows
- **AND** the rendered rows SHALL reflect the latest committed config plus only compatible live edits
