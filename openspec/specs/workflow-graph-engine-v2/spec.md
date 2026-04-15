# workflow-graph-engine-v2 Specification

## Purpose
TBD - created by archiving change rebuild-flow-node-api-v2. Update Purpose after archive.
## Requirements
### Requirement: Graph operations are implemented as pure engine commands
The workflow graph mutation layer SHALL expose pure command handlers that accept current graph state plus typed command payloads and return deterministic next state plus domain errors.

#### Scenario: Command evaluation is deterministic
- **WHEN** the same graph state and command payload are evaluated multiple times
- **THEN** the graph engine MUST return equivalent outputs each time

#### Scenario: Store layer delegates graph mutation to engine
- **WHEN** UI triggers a graph mutation command
- **THEN** the store MUST delegate mutation logic to graph engine handlers instead of embedding cross-cutting business rules inline

### Requirement: Typed command contracts enforce node-kind-safe updates
The graph engine SHALL use typed command payloads for node config updates and MUST reject invalid kind/key/value combinations.

#### Scenario: Invalid config command is rejected
- **WHEN** a command targets a node kind with an unsupported config key
- **THEN** the engine MUST return a validation error and MUST NOT mutate graph state

#### Scenario: Valid config command mutates exactly one semantic unit
- **WHEN** a valid node config command is applied
- **THEN** the engine MUST mutate only the intended semantic state and preserve unrelated graph state

### Requirement: Interaction history semantics remain stable under engine orchestration
The engine/store integration SHALL preserve interaction semantics where only semantic graph mutations create undo/redo history entries. Drag updates SHALL remain transient until drag end, and React Flow mount/layout-only node updates (including measurement or dimension updates that do not change graph meaning) MUST update the current graph state without creating additional history steps.

#### Scenario: Drag movement does not spam history
- **WHEN** node position updates arrive during drag in progress
- **THEN** transient updates MUST NOT create one history entry per pointer tick

#### Scenario: Drag release commits semantic history step
- **WHEN** drag operation ends with final node position
- **THEN** exactly one semantic history step MUST be committed for that drag sequence

#### Scenario: Node add followed by measurement update remains a single undo step
- **WHEN** a node is added and React Flow later reports measurement or layout metadata for that node
- **THEN** the measurement/layout update MUST NOT create an additional history entry
- **AND** a single undo action MUST remove the newly added node

#### Scenario: Initial mount measurement does not seed undo history
- **WHEN** the workflow canvas mounts and React Flow reports measurement/layout metadata for existing nodes
- **THEN** those runtime updates MUST NOT create undo history before any user graph mutation occurs

