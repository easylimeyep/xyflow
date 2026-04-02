## ADDED Requirements

### Requirement: Graph slice commands are organized into focused sub-slices
The graph commands SHALL be split across focused sub-slices: node CRUD operations in `node-crud-slice`, connection operations in `connection-slice`, and node change handling in `nodes-change-slice`. All commands MUST remain available on the composed store without API changes.

#### Scenario: Node CRUD commands are accessible on store
- **WHEN** a consumer calls `addNode`, `updateNodeLabel`, `updateNodeConfig`, or `isSetVariableNameUnique` on the store
- **THEN** the commands MUST execute with identical behavior as before the split

#### Scenario: Connection commands are accessible on store
- **WHEN** a consumer calls `onConnect` or `onEdgesChange` on the store
- **THEN** the commands MUST execute with identical behavior as before the split

#### Scenario: Node change handler is accessible on store
- **WHEN** a consumer calls `onNodesChange` on the store
- **THEN** drag tracking, edge cleanup, selection sync, and history commits MUST all behave identically

### Requirement: Graph slices do not directly import from the expression domain
Graph slice files (`graph-slice.ts`, `node-crud-slice.ts`, `connection-slice.ts`, `nodes-change-slice.ts`, `io-slice.ts`, `node-config-updates.ts`) MUST NOT import directly from `workflow/expression/refactor/`. All expression refactoring calls SHALL be routed through `store/graph-refactors.ts`.

#### Scenario: Rename operation still refactors expression references
- **WHEN** a node label is updated via `updateNodeLabel`
- **THEN** all expression strings in connected nodes that reference the old label MUST be updated to the new label

#### Scenario: Paste operation refactors expression references
- **WHEN** nodes are pasted from clipboard
- **THEN** expression references within pasted nodes MUST be remapped to new node IDs

### Requirement: `onNodesChange` logic is decomposed into named helper functions
The `onNodesChange` implementation MUST delegate distinct concerns to named private helper functions: computing next graph state, classifying change types, and determining history commit strategy. The handler body MUST NOT exceed 40 lines.

#### Scenario: Drag-and-release creates a single history entry
- **WHEN** a node is dragged and released
- **THEN** exactly one history entry MUST be committed (drag start squashes intermediate positions)

#### Scenario: Node deletion removes associated edges from history
- **WHEN** a node is deleted via keyboard or delete action
- **THEN** edges connected to the deleted node MUST be removed and the combined change MUST be a single history entry

### Requirement: `pasteFromClipboard` is decomposed into named helper functions
The paste operation MUST delegate node remapping, label deduplication, and edge reconstruction to named private helper functions. The main `pasteFromClipboard` body MUST NOT exceed 40 lines.

#### Scenario: Pasted nodes get unique labels
- **WHEN** a node with an existing label is pasted
- **THEN** the pasted node MUST receive a new unique label suffixed with a number

#### Scenario: Pasted edges are correctly reconnected
- **WHEN** a selection of connected nodes is pasted
- **THEN** edges between pasted nodes MUST be recreated with remapped IDs
