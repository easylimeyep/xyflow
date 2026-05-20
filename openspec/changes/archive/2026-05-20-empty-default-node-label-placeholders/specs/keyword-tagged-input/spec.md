## MODIFIED Requirements

### Requirement: Keyword renders tokens as an expression list

The system SHALL render the `Keyword` node `Tokens` control as a custom list of full `ExpressionInput` rows instead of a single scalar input. Empty keyword token rows SHALL use `token` as placeholder guidance.

#### Scenario: Keyword shows one expression row by default

- **WHEN** a `Keyword` node is rendered with no stored token values
- **THEN** the node SHALL show exactly one empty `ExpressionInput` row in the `Tokens` section
- **AND** the row SHOULD display `token` as placeholder guidance

#### Scenario: Keyword rehydrates all stored token rows

- **WHEN** a `Keyword` node is rendered with stored token values
- **THEN** the node SHALL render one `ExpressionInput` row for each stored token string in order
