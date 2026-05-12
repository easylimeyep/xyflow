# keyword-tagged-input Specification

## Purpose

TBD - created by archiving change keyword-tagged-input. Update Purpose after archive.

## Requirements

### Requirement: Keyword renders tokens as an expression list

The system SHALL render the `Keyword` node `Tokens` control as a custom list of full `ExpressionInput` rows instead of a single scalar input.

#### Scenario: Keyword shows one expression row by default

- **WHEN** a `Keyword` node is rendered with no stored token values
- **THEN** the node SHALL show exactly one empty `ExpressionInput` row in the `Tokens` section

#### Scenario: Keyword rehydrates all stored token rows

- **WHEN** a `Keyword` node is rendered with stored token values
- **THEN** the node SHALL render one `ExpressionInput` row for each stored token string in order

### Requirement: Keyword token list supports append and per-row removal

The system SHALL allow authors to append new token rows and remove existing token rows directly from the `Keyword` node card.

#### Scenario: Add action appends an empty token row

- **WHEN** a user activates the square plus action beside the `Tokens` input
- **THEN** the node SHALL append one empty `ExpressionInput` row to the end of the token list

#### Scenario: Hovering a row reveals a delete affordance

- **WHEN** a user hovers a token row that can be removed
- **THEN** the node SHALL reveal a delete badge positioned at the row corner

#### Scenario: Removing a token row preserves remaining order

- **WHEN** a user removes a token row from the middle of the token list
- **THEN** the node SHALL persist the remaining token rows in their original relative order

#### Scenario: Removing the final token row keeps one editable row

- **WHEN** a user removes the final remaining token row
- **THEN** the node SHALL keep one empty `ExpressionInput` row visible

### Requirement: Keyword token row actions preserve valid live drafts

The Keyword token list SHALL use the current visible row values, including valid uncommitted expression input drafts, when appending or removing token rows. Row actions MUST NOT rebuild the next persisted `template` array solely from stale committed config when a visible valid draft exists.

#### Scenario: Add token preserves typed empty visual row

- **WHEN** a `Keyword` node is rendered with no stored token values
- **AND** the user types a valid token into the single visible expression row without pressing Enter
- **AND** the user activates `Add token`
- **THEN** the node config SHALL persist the typed token as the first row
- **AND** the node config SHALL append one empty token row after it
- **AND** the visible first row SHALL continue to display the typed token

#### Scenario: Add token preserves edited existing row

- **WHEN** a `Keyword` node is rendered with one stored token row
- **AND** the user edits that row to a valid token without pressing Enter
- **AND** the user activates `Add token`
- **THEN** the node config SHALL persist the edited row value
- **AND** the node config SHALL append one empty token row after it

#### Scenario: Row action does not persist invalid live draft

- **WHEN** a `Keyword` token row contains a live validation error
- **AND** the user activates a token list row action
- **THEN** the invalid row value SHALL remain visible for correction
- **AND** the node config SHALL NOT persist the invalid live value as a new edit

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

### Requirement: Keyword templates persist as ordered arrays of strings

The system SHALL store `Keyword` `template` config values as ordered arrays of strings.

#### Scenario: Editing keyword rows updates array-backed config

- **WHEN** a user edits one or more keyword token rows
- **THEN** the node config key `template` SHALL be persisted as an ordered array of row string values

#### Scenario: Legacy scalar template values normalize to one row

- **WHEN** the editor imports or restores a `Keyword` node whose `template` config is a single string
- **THEN** the system SHALL normalize that value to a one-item string array while preserving the original string content

### Requirement: Keyword template refactors apply to every token row

Rename-driven expression refactors SHALL update every expression entry in the `Keyword` token list.

#### Scenario: Variable rename updates matching keyword rows

- **WHEN** a rename-triggered expression refactor targets a variable referenced in one or more keyword token rows
- **THEN** each matching token row SHALL be updated while non-matching rows remain unchanged
