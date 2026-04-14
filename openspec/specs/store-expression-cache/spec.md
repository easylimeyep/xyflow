# store-expression-cache Specification

## Purpose
Define requirements for expression variable cache isolation and selector behavior so variable suggestions remain deterministic and consistent with store state.
## Requirements
### Requirement: Expression variable catalog cache is scoped per store instance
The expression variable catalog cache SHALL remain store-instance scoped and SHALL persist computed entries for each target node key until structural graph version changes invalidate them.

#### Scenario: Separate stores do not share cache
- **WHEN** two workflow store instances are created in the same process
- **THEN** each store MUST maintain independent expression variable cache entries

#### Scenario: Cache is cleared on structural graph change
- **WHEN** nodes/edges/config semantics change structural graph version
- **THEN** the expression variable cache MUST be invalidated for the affected structural version

#### Scenario: Cache survives non-structural updates
- **WHEN** pointer, viewport, or position-only updates occur without structural changes
- **THEN** existing expression cache entries MUST remain reusable

### Requirement: Expression variable selector is a pure read-only function
`selectExpressionVariablesForNode` SHALL remain a pure read path over store state and SHALL return stable references for unchanged structural inputs.

#### Scenario: Selector returns stable reference when structure is unchanged
- **WHEN** selector is called repeatedly for the same node key and unchanged structural version
- **THEN** selector MUST return the same cached reference

#### Scenario: Selector returns updated value after upstream variable semantics change
- **WHEN** upstream variable-providing node semantics change and structural version updates
- **THEN** selector MUST return recomputed expression variables that reflect latest semantics

#### Scenario: Selector remains test-isolated across store instances
- **WHEN** tests create fresh store instances and query expression selectors
- **THEN** results MUST be unaffected by previous test store cache state

