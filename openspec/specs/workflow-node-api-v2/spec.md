# workflow-node-api-v2 Specification

## Purpose
TBD - created by archiving change rebuild-flow-node-api-v2. Update Purpose after archive.
## Requirements
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

### Requirement: Node rendering is resolved through explicit client bindings
The editor SHALL resolve custom node components through an explicit client-side view registry derived from node modules. Rendering bindings MUST NOT be attached by mutating the pure node registry as a side effect.

#### Scenario: Explicit component binding is used for rendering
- **WHEN** a node kind has a custom renderer in the client view registry
- **THEN** the editor MUST render that component for the node kind

#### Scenario: Fallback renderer is deterministic for simple nodes
- **WHEN** a node definition does not have a custom renderer in the client view registry
- **THEN** the editor MUST render a deterministic default node renderer

#### Scenario: Node type construction has no side-effect binding import
- **WHEN** React Flow node types are built
- **THEN** node type construction MUST combine pure definitions and explicit client component bindings without importing a module solely for registry mutation side effects

#### Scenario: Client component bindings reference valid node kinds
- **WHEN** the client view registry declares a custom renderer for a node kind
- **THEN** that node kind MUST exist in the pure Node API v2 definition registry

### Requirement: Node behavior hooks are declarative and typed
Node API v2 SHALL expose typed behavior hooks (including expression keys, rename semantics, and variable-provision behavior) that drive runtime side-effects.

#### Scenario: Rename behavior is definition-driven
- **WHEN** a node definition declares rename behavior for a config key
- **THEN** rename-triggered expression refactoring MUST be executed through the declared behavior without hardcoded node-kind checks

#### Scenario: Expression key discovery is definition-driven
- **WHEN** runtime resolves expression-bearing config keys for a node kind
- **THEN** it MUST use the keys declared in the node definition behavior contract
