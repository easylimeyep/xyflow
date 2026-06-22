## MODIFIED Requirements

### Requirement: Graph operations are implemented as pure engine commands
The workflow graph mutation layer SHALL expose pure command handlers that accept current graph state plus typed command payloads and return deterministic next state plus domain errors. Graph topology SHALL support both acyclic and cyclic connectivity.

#### Scenario: Command evaluation is deterministic
- **WHEN** the same graph state and command payload are evaluated multiple times
- **THEN** the graph engine MUST return equivalent outputs each time

#### Scenario: Store layer delegates graph mutation to engine
- **WHEN** UI triggers a graph mutation command
- **THEN** the store MUST delegate mutation logic to graph engine handlers instead of embedding cross-cutting business rules inline

#### Scenario: Connection command accepts cycle-forming edge
- **WHEN** a connect command introduces a cycle and satisfies node-kind, handle, duplicate, and root constraints
- **THEN** the graph engine MUST return success and include the new edge in next graph state
