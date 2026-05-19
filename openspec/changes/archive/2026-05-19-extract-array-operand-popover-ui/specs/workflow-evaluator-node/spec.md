## ADDED Requirements

### Requirement: Evaluator array operand editor uses controlled workflow state

The evaluator condition editor SHALL own array operand draft state and commit timing while rendering the array input popover through a reusable UI package component that receives plain controlled props.

#### Scenario: Array operand draft edits remain uncommitted until close

- **WHEN** a user opens an evaluator array operand popover and edits a row value
- **THEN** the evaluator node config MUST NOT be updated before the popover closes
- **AND** the open popover preview MAY reflect the draft row value

#### Scenario: Array operand draft commits on close

- **WHEN** a user closes an evaluator array operand popover after changing draft row values
- **THEN** the evaluator node config MUST be updated with an array typed operand containing the normalized draft values

#### Scenario: Reusable array input popover stays workflow agnostic

- **WHEN** the evaluator renders the array operand popover UI
- **THEN** the reusable UI component MUST receive plain string array values and callbacks
- **AND** the reusable UI component MUST NOT depend on evaluator condition types or `WorkflowTypedValue`
