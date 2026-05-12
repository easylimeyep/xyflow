## ADDED Requirements

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
