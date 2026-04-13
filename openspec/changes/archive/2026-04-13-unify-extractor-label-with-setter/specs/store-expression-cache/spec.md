## MODIFIED Requirements

### Requirement: Expression variable selector is a pure read-only function
`selectExpressionVariablesForNode` SHALL compute and return expression variables without any module-level side effects. It MUST read only from Zustand store state.

#### Scenario: Selector returns updated extractor variable after extractor Label config change
- **WHEN** an upstream `extractor` node `config.extractExpression` is updated and `selectExpressionVariablesForNode` is called for a downstream node
- **THEN** the returned variables MUST reflect the updated `config.extractExpression`

#### Scenario: Selector prioritizes extractor config variable over node title
- **WHEN** an upstream `extractor` node has `config.extractExpression = "price"` and `node.data.label` differs from `"price"`
- **THEN** the returned extractor variable MUST be `"price"` and MUST NOT be derived from `node.data.label`

#### Scenario: Selector returns updated setVariable variable after variableName change
- **WHEN** an upstream `setVariable` node `config.variableName` is updated and `selectExpressionVariablesForNode` is called for a downstream node
- **THEN** the returned variables MUST reflect the updated `config.variableName`

#### Scenario: Selector is callable in tests without shared state pollution
- **WHEN** a test creates a fresh store and calls `selectExpressionVariablesForNode`
- **THEN** the result MUST NOT be influenced by any previously run test's store state
