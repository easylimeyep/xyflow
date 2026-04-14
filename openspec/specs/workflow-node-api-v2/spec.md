# workflow-node-api-v2 Specification

## Purpose
TBD - created by archiving change rebuild-flow-node-api-v2. Update Purpose after archive.
## Requirements
### Requirement: Node API v2 is the single source of truth for node kinds
The system SHALL define each node kind through a single Node API v2 definition that binds UI rendering, config schema/defaults, graph rules, and runtime behaviors.

#### Scenario: New node kind is fully described in one definition contract
- **WHEN** a developer introduces a new node kind
- **THEN** the node kind MUST be declared through one Node API v2 definition that includes component binding, schema/defaults, and behavior metadata

#### Scenario: Runtime uses definition contract as authoritative source
- **WHEN** the editor resolves node metadata or behavior for a node kind
- **THEN** it MUST read from the Node API v2 definition instead of duplicated per-layer maps

### Requirement: Node rendering is definition-driven without manual override maps
The editor SHALL resolve node components directly from node definitions and MUST NOT require a separate manual component override registry.

#### Scenario: Definition component is used for rendering
- **WHEN** a node definition declares a custom component
- **THEN** the editor MUST render that component for the node kind

#### Scenario: Fallback renderer is deterministic for simple nodes
- **WHEN** a node definition does not declare a custom component
- **THEN** the editor MUST render a deterministic default node renderer

### Requirement: Node behavior hooks are declarative and typed
Node API v2 SHALL expose typed behavior hooks (including expression keys, rename semantics, and variable-provision behavior) that drive runtime side-effects.

#### Scenario: Rename behavior is definition-driven
- **WHEN** a node definition declares rename behavior for a config key
- **THEN** rename-triggered expression refactoring MUST be executed through the declared behavior without hardcoded node-kind checks

#### Scenario: Expression key discovery is definition-driven
- **WHEN** runtime resolves expression-bearing config keys for a node kind
- **THEN** it MUST use the keys declared in the node definition behavior contract

