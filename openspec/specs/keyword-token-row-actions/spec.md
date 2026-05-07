# keyword-token-row-actions Specification

## Purpose

Define the authoring layout for `Keyword` token-list row actions so token editing controls are visually separated from workflow output controls.

## Requirements

### Requirement: Keyword token delete actions stay inside the token list

The system SHALL render token delete actions inside the `Keyword` node token-list editing area rather than near the node output edge.

#### Scenario: Delete action is separated from output affordance

- **WHEN** a `Keyword` node with deletable token rows is rendered on canvas
- **THEN** each available token delete action SHALL be positioned inside the token row editing area
- **AND** it SHALL NOT overlap or visually occupy the node output quick-add area

#### Scenario: Delete action appears without row layout shift

- **WHEN** a user hovers or focuses a deletable token row
- **THEN** the row delete action SHALL become clearly available
- **AND** the token input SHALL NOT shift position due to the delete action appearing

### Requirement: Keyword Add token is a list-level action

The system SHALL render `Add token` as an action below the token rows rather than as an inline control inside the first token row.

#### Scenario: Add token appears below token rows

- **WHEN** a `Keyword` node is rendered on canvas
- **THEN** an action labeled `Add token` SHALL be visible after the token row list
- **AND** it SHALL NOT be rendered as a sibling control inside the first token row

#### Scenario: Add token appends a row

- **WHEN** a user activates `Add token`
- **THEN** the keyword token list SHALL append a new empty token row
- **AND** existing token values SHALL be preserved

### Requirement: Keyword token action behavior is preserved

The system SHALL preserve existing token-list editing semantics while changing action placement.

#### Scenario: Delete token removes intended row

- **WHEN** a user activates the delete action for a token row
- **THEN** that token row SHALL be removed from the keyword token list
- **AND** other token values SHALL be preserved

#### Scenario: Delete action respects node interactivity

- **WHEN** a `Keyword` node is rendered with token editing interactivity disabled
- **THEN** token delete actions SHALL NOT be available
