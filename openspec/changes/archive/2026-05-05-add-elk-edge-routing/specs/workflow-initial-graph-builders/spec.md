## MODIFIED Requirements

### Requirement: Flow package provides an ELK-backed initial-graph builder
The flow package SHALL expose an asynchronous initial-graph builder that reuses the workflow ELK auto-layout pipeline to compute initial node positions and route-aware edge presentation data.

#### Scenario: ELK builder returns an asynchronously positioned graph
- **WHEN** a consumer calls the ELK-backed initial-graph builder
- **THEN** the builder MUST return a promise that resolves to a `WorkflowGraphState`
- **AND** the resolved graph MUST preserve the same node ids, edge ids, and edge connectivity as the normalized compact input
- **AND** the resolved graph MUST include routed edge presentation data for edges where the workflow ELK auto-layout pipeline returns usable route sections.

#### Scenario: ELK builder shares workflow layout semantics
- **WHEN** the ELK-backed builder computes positions for a graph with named output handles
- **THEN** it MUST use the same workflow ELK layout pipeline that powers the editor auto-layout behavior
- **AND** branch and multi-handle routing semantics MUST remain handle-aware
- **AND** any routed edge presentation data MUST use the same route model produced by editor auto-layout.
