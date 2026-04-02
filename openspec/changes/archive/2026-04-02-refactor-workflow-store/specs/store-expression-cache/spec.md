## ADDED Requirements

### Requirement: Expression variable catalog cache is scoped per store instance
The expression variable catalog cache SHALL be stored inside Zustand store state, not in module-level variables. Each store instance MUST maintain its own independent cache. The cache MUST be reset whenever the expression structural signature changes.

#### Scenario: Separate stores do not share cache
- **WHEN** two workflow store instances are created in the same process
- **THEN** each store MUST maintain its own independent expression variable catalog cache

#### Scenario: Cache is cleared on structural graph change
- **WHEN** nodes or edges are added, removed, or renamed such that the expression structural signature changes
- **THEN** the expression catalog cache MUST be reset to an empty map

#### Scenario: Cache survives position-only changes
- **WHEN** a node is moved (position-only change, no structural change)
- **THEN** the expression structural signature MUST remain unchanged and the cache MUST not be cleared

### Requirement: Expression variable selector is a pure read-only function
`selectExpressionVariablesForNode` SHALL compute and return expression variables without any module-level side effects. It MUST read only from Zustand store state.

#### Scenario: Selector returns correct variables after a graph change
- **WHEN** a node's label is updated and `selectExpressionVariablesForNode` is called for a downstream node
- **THEN** the returned variables MUST reflect the updated label

#### Scenario: Selector is callable in tests without shared state pollution
- **WHEN** a test creates a fresh store and calls `selectExpressionVariablesForNode`
- **THEN** the result MUST NOT be influenced by any previously run test's store state
