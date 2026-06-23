# workflow-initial-graph-builders Specification

## Purpose

Define the public builder utilities that let consumers describe a compact workflow graph and produce a normalized `WorkflowGraphState` using ELK-based auto-layout.

## Requirements

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

### Requirement: Initial graph builders remain DOM-independent

The public initial-graph builder utilities SHALL remain usable without mounting a React workflow editor, and measured initial auto-layout SHALL be provided by the editor runtime rather than by the builder utilities.

#### Scenario: ELK builder remains available outside the editor

- **WHEN** a consumer calls `createInitialGraphElk` outside a mounted React workflow editor
- **THEN** the builder SHALL continue to return an asynchronously positioned `WorkflowGraphState`
- **AND** the builder MUST NOT require rendered DOM measurements.

#### Scenario: Measured initial layout is requested through WorkflowEditor

- **WHEN** a consumer needs initial layout that accounts for rendered node dimensions
- **THEN** the consumer SHALL be able to pass a normalized initial graph to `WorkflowEditor` with `autoLayoutOnInit="after-measure"`
- **AND** the editor SHALL be responsible for waiting on rendered node measurements before computing the initial measured layout.
