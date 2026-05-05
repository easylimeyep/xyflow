## MODIFIED Requirements

### Requirement: Node API v2 is the single source of truth for node kinds

The system SHALL define each node kind through a Node API v2 module that owns its config schema/defaults, graph rules, runtime behavior metadata, and optional UI rendering entrypoint. Pure node metadata MUST remain importable without loading client-only React components. The conditional logic node kind MUST be `evaluator`; `branch` MUST NOT be registered as a supported node kind.

#### Scenario: New node kind is fully described by one node module

- **WHEN** a developer introduces a new node kind
- **THEN** the node kind MUST be declared through a node-owned module that includes or exports its definition, schema/defaults, behavior metadata, and optional custom renderer

#### Scenario: Runtime uses pure definition contract as authoritative source

- **WHEN** the editor resolves node metadata or behavior for a node kind
- **THEN** it MUST read from the pure Node API v2 definition instead of duplicated per-layer maps

#### Scenario: Non-UI workflow layers do not import client renderers

- **WHEN** store, validation, DTO mapping, graph engine, layout, or pure registry tests import node definitions
- **THEN** those imports MUST NOT require React Flow node components or client-only renderer modules

#### Scenario: Branch kind is not registered

- **WHEN** the node definition registry is evaluated after this change
- **THEN** `evaluator` MUST be registered as the conditional logic node kind
- **AND** `branch` MUST NOT be registered as an alias or legacy node kind
