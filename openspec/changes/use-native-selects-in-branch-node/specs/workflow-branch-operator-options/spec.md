## ADDED Requirements

### Requirement: Branch boolean block uses native select controls for branch choices
The branch boolean block SHALL render interactive branch choice controls with the shared native select component used by other workflow nodes, while preserving the existing stored values and display labels.

#### Scenario: Condition operator uses native select
- **WHEN** the branch boolean block renders a condition operator control
- **THEN** the control MUST be a native select control
- **AND** each option value MUST remain the operator `id`
- **AND** each option label MUST remain the operator `value`

#### Scenario: Logical operator uses native select
- **WHEN** the branch boolean block renders the first editable logical operator between multiple conditions
- **THEN** the control MUST be a native select control
- **AND** selecting `AND` MUST store `and`
- **AND** selecting `OR` MUST store `or`

#### Scenario: Non-interactive logical separators remain badges
- **WHEN** the branch boolean block renders additional logical separators after the first editable separator
- **THEN** those separators MUST remain non-interactive text badges
