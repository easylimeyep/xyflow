## MODIFIED Requirements

### Requirement: Variable insertion commits immediately
`ExpressionInput` SHALL call `onChange` immediately when a variable is inserted via the variable picker, without waiting for blur. Picker interaction MUST remain reliable when moving focus from the editor to the picker causes an editor blur and parent state update.

#### Scenario: Variable insertion triggers onChange
- **WHEN** the user selects a variable from the picker
- **THEN** `onChange` is called immediately with the updated expression

#### Scenario: Variable insertion survives blur commit in list row
- **WHEN** the user types `{{}}` in an expression row inside a keyword expression list and clicks a variable in the opened picker
- **THEN** the selected variable is inserted on the first click
- **THEN** the picker closes only after insertion has been committed
