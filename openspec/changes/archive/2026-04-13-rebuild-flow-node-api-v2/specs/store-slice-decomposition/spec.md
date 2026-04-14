## MODIFIED Requirements

### Requirement: Graph slice commands are organized into focused sub-slices
Workflow editor command orchestration SHALL expose focused responsibilities where UI/store wiring delegates graph mutation semantics to graph-engine command handlers. Public store command surface MUST remain behaviorally compatible for editor consumers.

#### Scenario: Node CRUD command entry points remain available to editor consumers
- **WHEN** editor UI invokes add/update node command entry points on the store
- **THEN** command invocation MUST remain available while mutation semantics execute through graph-engine handlers

#### Scenario: Connection command entry points remain available to editor consumers
- **WHEN** editor UI invokes connect/edge-change command entry points on the store
- **THEN** command invocation MUST remain available while validation/mutation semantics execute through graph-engine handlers

#### Scenario: Node change entry point preserves behavior contracts
- **WHEN** editor UI invokes node-change command entry points
- **THEN** selection sync, edge cleanup, and history semantics MUST remain behaviorally equivalent to editor expectations

### Requirement: `onNodesChange` logic is decomposed into named helper functions
Node change orchestration SHALL be decomposed into explicit helper and/or engine handlers for change projection, interaction classification, and commit policy determination.

#### Scenario: Drag-and-release creates a single semantic history entry
- **WHEN** node drag interaction starts, updates, and ends
- **THEN** history MUST record one semantic commit for the completed drag interaction

#### Scenario: Node deletion removes associated edges in a single semantic change
- **WHEN** nodes are removed
- **THEN** incident edges MUST be removed as part of the same semantic graph transition

### Requirement: `pasteFromClipboard` is decomposed into named helper functions
Clipboard paste orchestration SHALL delegate payload parsing, node remapping, label reconciliation, and edge reconstruction to explicit helper or engine modules.

#### Scenario: Pasted nodes receive deterministic unique labels
- **WHEN** pasted node labels conflict with existing graph labels
- **THEN** pasted labels MUST be deterministically deduplicated

#### Scenario: Pasted edges reconnect using remapped node IDs
- **WHEN** a connected node selection is pasted
- **THEN** edges between pasted nodes MUST be recreated using the new node ID mapping
