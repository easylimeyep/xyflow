## REMOVED Requirements

### Requirement: Flow package provides a synchronous linear initial-graph builder
**Reason**: Linear topological placement is DAG-specific and cannot represent arbitrary cyclic graph expectations consistently.
**Migration**: Consumers SHALL use the ELK-backed initial graph builder path for initial positioning; any callers expecting synchronous linear coordinates MUST migrate to asynchronous ELK layout handling.

## MODIFIED Requirements

### Requirement: Flow package provides an ELK-backed initial-graph builder
The flow package SHALL expose an ELK-backed initial-graph builder as the default initial positioning mechanism for normalized graphs, including graphs that contain cycles.

#### Scenario: ELK builder returns an asynchronously positioned graph
- **WHEN** a consumer calls the ELK-backed initial-graph builder
- **THEN** the builder MUST return a promise that resolves to a `WorkflowGraphState`
- **AND** the resolved graph MUST preserve the same node ids, edge ids, and edge connectivity as the normalized compact input
- **AND** the resolved graph MUST include routed edge presentation data for edges where the workflow ELK auto-layout pipeline returns usable route sections.

#### Scenario: ELK builder supports cyclic graphs
- **WHEN** the input graph contains one or more cycle-forming connections
- **THEN** initial graph building MUST complete without topology-cycle validation failure
- **AND** the returned graph MUST preserve cyclic edge connectivity.

#### Scenario: ELK builder shares workflow layout semantics
- **WHEN** the ELK-backed builder computes positions for a graph with named output handles
- **THEN** it MUST use the same workflow ELK layout pipeline that powers the editor auto-layout behavior
- **AND** evaluator and multi-handle routing semantics MUST remain handle-aware
- **AND** any routed edge presentation data MUST use the same route model produced by editor auto-layout.
