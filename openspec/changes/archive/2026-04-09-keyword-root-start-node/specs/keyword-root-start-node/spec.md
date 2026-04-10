## ADDED Requirements

### Requirement: Keyword exposes a Root toggle in node header
The system SHALL render a `Root` checkbox in the `Keyword` node card header, adjacent to the node title, and SHALL persist its value in node config.

#### Scenario: Root toggle is visible on Keyword node
- **WHEN** a `Keyword` node is rendered on canvas
- **THEN** a checkbox labeled `Root` SHALL be visible in the node header next to the title

#### Scenario: Root toggle updates stored config
- **WHEN** a user toggles the `Root` checkbox on a `Keyword` node
- **THEN** the node config key `isRoot` SHALL be updated to the corresponding boolean value

### Requirement: Root Keyword behaves as a start node without input handle
A `Keyword` node with `isRoot = true` SHALL not expose an input handle.

#### Scenario: Input handle is hidden for root keyword
- **WHEN** a `Keyword` node has `isRoot` set to `true`
- **THEN** the node SHALL render without a target/input handle

#### Scenario: Input handle is shown for non-root keyword
- **WHEN** a `Keyword` node has `isRoot` set to `false`
- **THEN** the node SHALL render with its target/input handle

### Requirement: Root Keyword rejects incoming connections
The system SHALL reject incoming edge creation targeting a `Keyword` node with `isRoot = true`.

#### Scenario: Direct connect to root keyword is blocked
- **WHEN** a connection is attempted from any source node to a root `Keyword` node
- **THEN** connection validation SHALL return invalid

### Requirement: Enabling Root removes existing incoming edges
When a `Keyword` node is changed from non-root to root, the system SHALL remove all incoming edges targeting that node.

#### Scenario: Existing incoming edges are pruned on toggle
- **WHEN** a `Keyword` node with one or more incoming edges is toggled to `isRoot = true`
- **THEN** all edges with `target` equal to that node id SHALL be removed from graph state

### Requirement: Multiple root keywords are allowed
The system SHALL allow more than one `Keyword` node to have `isRoot = true` in the same workflow.

#### Scenario: Two keywords can both be root
- **WHEN** two distinct `Keyword` nodes are each toggled to `isRoot = true`
- **THEN** both nodes SHALL remain root and no uniqueness error SHALL be raised

### Requirement: Trigger node is removed from active authoring model
The system SHALL no longer expose `trigger` as an active node kind in registry, palette, or default graph initialization.

#### Scenario: Trigger is absent from node palette
- **WHEN** the node palette is rendered
- **THEN** no node option labeled `Trigger` SHALL be shown

#### Scenario: Default graph starts from root keyword
- **WHEN** a new workflow graph is initialized from defaults
- **THEN** it SHALL include a `Keyword` node with `isRoot = true`
- **THEN** it SHALL NOT include any node with kind `trigger`

### Requirement: Legacy trigger payloads are not migrated
The system SHALL not auto-migrate legacy node kind `trigger` during import.

#### Scenario: Import containing trigger fails validation
- **WHEN** a workflow import payload includes a node with kind `trigger` after trigger removal
- **THEN** schema validation/parsing SHALL reject the payload as invalid
