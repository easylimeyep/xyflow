## ADDED Requirements

### Requirement: Flow package provides a compact initial-graph builder input
The flow package SHALL provide a compact initial-graph builder input contract that lets consumers describe workflow nodes and edges without manually specifying node rendering coordinates, node width, or edge metadata.

#### Scenario: Consumer provides semantic node and edge input
- **WHEN** a consumer defines an initial graph through the public builder input contract
- **THEN** each node input MUST only need workflow semantics such as `id`, `kind`, optional `label`, and optional partial `config`
- **AND** each edge input MUST only need connection semantics such as endpoints and optional handle ids
- **AND** the consumer MUST NOT be required to provide `position`, `width`, `type`, or edge `data`

### Requirement: Builder normalizes compact input into a valid workflow graph state
The system SHALL transform compact initial-graph input into a valid `WorkflowGraphState` by filling node defaults, edge metadata, document defaults, and viewport defaults from existing workflow sources of truth.

#### Scenario: Builder fills node and edge defaults
- **WHEN** a consumer builds an initial graph from compact input
- **THEN** the resulting graph MUST assign each node `type` from its `kind`
- **AND** each node label MUST default from the node definition title when omitted
- **AND** each node config MUST be produced by merging the consumer's partial config over the node definition default config
- **AND** each normalized edge MUST include `sourceKind` and `targetKind` metadata derived from the referenced nodes

#### Scenario: Builder fills document and viewport defaults
- **WHEN** a consumer omits document or viewport fields from the compact input
- **THEN** the resulting graph MUST include a valid document object and viewport object using workflow package defaults

### Requirement: Flow package provides a synchronous linear initial-graph builder
The flow package SHALL expose a synchronous builder that positions normalized workflow nodes using a deterministic left-to-right linear layout.

#### Scenario: Linear builder returns positioned graph synchronously
- **WHEN** a consumer calls the synchronous initial-graph builder
- **THEN** the builder MUST return a `WorkflowGraphState` without asynchronous work
- **AND** every node in the returned graph MUST include a resolved position

#### Scenario: Linear builder produces stable branch ordering
- **WHEN** the synchronous builder lays out a graph containing a branch node with multiple named outputs
- **THEN** the vertical ordering of branch descendants MUST follow the output-handle order declared by the workflow node definition
- **AND** repeated builds with the same input MUST produce the same node positions

### Requirement: Flow package provides an ELK-backed initial-graph builder
The flow package SHALL expose an asynchronous initial-graph builder that reuses the workflow ELK auto-layout pipeline to compute initial node positions.

#### Scenario: ELK builder returns an asynchronously positioned graph
- **WHEN** a consumer calls the ELK-backed initial-graph builder
- **THEN** the builder MUST return a promise that resolves to a `WorkflowGraphState`
- **AND** the resolved graph MUST preserve the same node ids, edge ids, and edge connectivity as the normalized compact input

#### Scenario: ELK builder shares workflow layout semantics
- **WHEN** the ELK-backed builder computes positions for a graph with named output handles
- **THEN** it MUST use the same workflow ELK layout pipeline that powers the editor auto-layout behavior
- **AND** branch and multi-handle routing semantics MUST remain handle-aware
