## MODIFIED Requirements

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
