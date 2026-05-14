## ADDED Requirements

### Requirement: WorkflowEditor accepts external validation snapshots
The system SHALL allow host applications to pass workflow validation snapshots into `WorkflowEditor` without requiring the editor to fetch validation from a server.

#### Scenario: Host passes validation from a query
- **WHEN** a host renders `WorkflowEditor` with a validation snapshot returned by its data-fetching layer
- **THEN** the editor MUST synchronize that snapshot into workflow validation state
- **AND** the editor MUST render validation feedback from that snapshot

#### Scenario: Host clears validation
- **WHEN** a host renders `WorkflowEditor` with `validation` set to `null` or `undefined`
- **THEN** the editor MUST clear visible server validation feedback

#### Scenario: Repeated validation revision is received
- **WHEN** `WorkflowEditor` receives a validation snapshot with the same `revision` as the current server validation snapshot
- **THEN** the editor MUST NOT treat the snapshot as a newly validated result
- **AND** locally hidden validation messages MUST remain hidden

#### Scenario: New validation revision is received
- **WHEN** `WorkflowEditor` receives a validation snapshot with a different `revision` from the current server validation snapshot
- **THEN** the editor MUST replace the current server validation snapshot
- **AND** the editor MUST clear locally hidden validation messages

### Requirement: Validation remains outside graph state
The system SHALL store externally supplied validation separately from workflow graph state and persisted node data.

#### Scenario: Validation is applied
- **WHEN** validation is synchronized into the workflow store
- **THEN** workflow nodes and edges MUST NOT be mutated to contain validation messages
- **AND** workflow history MUST NOT receive a new undo entry because validation changed

#### Scenario: Workflow is exported
- **WHEN** a workflow with visible validation feedback is exported
- **THEN** exported workflow data MUST NOT include validation messages or locally hidden validation state

#### Scenario: Workflow history changes
- **WHEN** a user performs undo or redo
- **THEN** undo and redo MUST operate on workflow graph history
- **AND** validation state MUST NOT be replayed as graph history entries

### Requirement: Global validation messages render through Alert
The system SHALL render workflow-level validation messages through an Alert-based surface separate from transient editor operation status.

#### Scenario: Global validation exists
- **WHEN** the visible validation snapshot contains one or more global messages
- **THEN** the editor MUST render an Alert surface for workflow-level validation
- **AND** the first global message MUST be readable without opening a node

#### Scenario: No global validation exists
- **WHEN** the visible validation snapshot contains no global messages
- **THEN** the editor MUST NOT render the global validation Alert surface

#### Scenario: Transient editor error exists with validation
- **WHEN** the editor has both a transient editor operation error and global workflow validation
- **THEN** the workflow validation Alert MUST remain independent from the transient editor operation status

### Requirement: Node validation messages mark affected nodes
The system SHALL render visible node-level validation messages on the affected workflow nodes.

#### Scenario: Node has validation messages
- **WHEN** the visible validation snapshot contains one or more messages for a node id present in the graph
- **THEN** that node MUST render with a destructive validation visual state
- **AND** the node MUST expose the validation message text through a compact node-level affordance

#### Scenario: Node has multiple validation messages
- **WHEN** a node has multiple visible validation messages
- **THEN** the node-level validation affordance MUST make all messages available to the user

#### Scenario: Validation references an unknown node
- **WHEN** a validation snapshot contains a node message for a node id that is not present in the graph
- **THEN** the editor MUST NOT crash
- **AND** the unknown-node message MUST NOT be attached to any unrelated node

#### Scenario: Node validation coexists with selection
- **WHEN** a node is both selected and has visible validation messages
- **THEN** the node MUST preserve both selected and validation visual states

### Requirement: Local edits hide stale node validation until next server revision
The system SHALL optimistically hide visible validation for locally edited graph areas until a new server validation revision arrives.

#### Scenario: Node config changes
- **WHEN** a user changes a node config value
- **THEN** visible validation messages for that node MUST be hidden locally
- **AND** other node validation messages MUST remain visible

#### Scenario: Node label changes
- **WHEN** a user changes a node label
- **THEN** visible validation messages for that node MUST be hidden locally
- **AND** other node validation messages MUST remain visible

#### Scenario: Edge changes
- **WHEN** a user adds or removes an edge
- **THEN** visible validation messages for touched source and target nodes MUST be hidden locally
- **AND** visible global validation messages MAY be hidden locally because graph structure changed

#### Scenario: Node collection changes
- **WHEN** a user adds, duplicates, deletes, or imports nodes
- **THEN** visible global validation messages MUST be hidden locally
- **AND** validation messages for removed nodes MUST no longer be visible on the canvas

#### Scenario: Server confirms validation after local edit
- **WHEN** a new server validation revision arrives after local validation messages were hidden
- **THEN** locally hidden state MUST be cleared
- **AND** messages present in the new validation snapshot MUST become visible again

### Requirement: Validation API supports query and stream integrations
The system SHALL expose validation types that are usable by host applications with polling, query cache, WebSocket, or SSE integrations.

#### Scenario: Query-based integration
- **WHEN** a host receives validation from a polling or query-based data source
- **THEN** the host MUST be able to pass the returned validation object directly to `WorkflowEditor`

#### Scenario: Stream-based integration
- **WHEN** a host receives validation from a stream and writes the latest snapshot into a query cache or local state
- **THEN** the host MUST be able to pass the cached validation object to `WorkflowEditor`

#### Scenario: Validation includes field path
- **WHEN** a node validation message includes `fieldPath`
- **THEN** the editor MUST preserve the field path in validation state for consumers
- **AND** the first implementation MAY render the message only at node level
