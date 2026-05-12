## ADDED Requirements

### Requirement: ExpressionInput preserves focused live draft across unrelated renders

The expression editor SHALL preserve the current focused editor content when the parent component re-renders without changing the committed `value` prop. Unrelated workflow node config updates MUST NOT replace the focused live editor document with an older committed value.

#### Scenario: Same committed value render keeps focused draft

- **WHEN** the user types into the expression editor without committing
- **AND** the parent component re-renders with the same committed `value` prop
- **THEN** the editor continues to display the typed uncommitted value
- **AND** the commit callback is NOT called solely because of the re-render

#### Scenario: Keyword case sensitive toggle keeps token draft

- **WHEN** the user types into a Keyword token expression row without committing
- **AND** the user toggles the Keyword `Case sensitive` checkbox
- **THEN** the checkbox state is stored in node config
- **AND** the token expression row continues to display the typed uncommitted value

#### Scenario: Unfocused editor still syncs external value

- **WHEN** the expression editor is not focused
- **AND** the committed `value` prop changes from an external source
- **THEN** the editor displays the new committed value
