## MODIFIED Requirements

### Requirement: Expression variable selector is a pure read-only function
`selectExpressionVariablesForNode` SHALL compute and return expression variables without any module-level side effects. It MUST read only from Zustand store state.

#### Scenario: Selector returns updated extractor variable after label rename
- **WHEN** an upstream `extractor` node label is updated and `selectExpressionVariablesForNode` is called for a downstream node
- **THEN** the returned variables MUST reflect the updated extractor label

#### Scenario: Selector returns updated setVariable variable after variableName change
- **WHEN** an upstream `setVariable` node `config.variableName` is updated and `selectExpressionVariablesForNode` is called for a downstream node
- **THEN** the returned variables MUST reflect the updated `config.variableName`

#### Scenario: Selector is callable in tests without shared state pollution
- **WHEN** a test creates a fresh store and calls `selectExpressionVariablesForNode`
- **THEN** the result MUST NOT be influenced by any previously run test's store state
