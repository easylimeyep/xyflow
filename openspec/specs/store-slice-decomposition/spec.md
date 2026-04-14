# store-slice-decomposition Specification

## Purpose
Define required decomposition boundaries and behavior guarantees for workflow store graph slices.
## Requirements
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

### Requirement: Graph slices do not directly import from the expression domain
Graph slice files (`graph-slice.ts`, `node-crud-slice.ts`, `connection-slice.ts`, `nodes-change-slice.ts`, `io-slice.ts`, `node-config-updates.ts`) MUST NOT import directly from `workflow/expression/refactor/`. All expression refactoring calls SHALL be routed through `store/graph-refactors.ts`.

#### Scenario: Rename operation still refactors expression references
- **WHEN** a node label is updated via `updateNodeLabel`
- **THEN** all expression strings in connected nodes that reference the old label MUST be updated to the new label

#### Scenario: Paste operation refactors expression references
- **WHEN** nodes are pasted from clipboard
- **THEN** expression references within pasted nodes MUST be remapped to new node IDs

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

