## ADDED Requirements

### Requirement: Domain workflow drafts export to backend persistence DTOs

The workflow mapper layer SHALL provide an `exportDraftDomainWorkflowForBackend` utility that converts a structurally valid `DomainWorkflowDTO` into a `BackendWorkflowDTO` without requiring the workflow to be execution-ready.

#### Scenario: Draft backend export preserves workflow document fields

- **WHEN** a domain workflow draft is exported for backend persistence
- **THEN** the backend DTO MUST preserve the workflow `id`, `name`, `version`, and `metadata`
- **AND** the backend DTO MUST contain a `nodes` array of backend workflow nodes

#### Scenario: Draft backend export preserves node semantic fields

- **WHEN** a domain workflow draft node is exported for backend persistence
- **THEN** the backend node MUST preserve the node `kind`, `position`, `label`, and `config`
- **AND** the backend node id MUST be a number assigned by draft backend export order

#### Scenario: Draft backend export allows incomplete workflow readiness

- **WHEN** a domain workflow draft has no root nodes, a root node with incoming connections, unreachable nodes, a cycle, or missing evaluator branches
- **THEN** draft backend export MUST return a backend DTO instead of failing for workflow-readiness validation

#### Scenario: Draft backend export rejects unknown edge endpoints

- **WHEN** a domain workflow draft connection references a source or target node ID that is absent from the domain workflow nodes
- **THEN** draft backend export MUST fail with an explicit validation error

### Requirement: Draft backend export assigns deterministic numeric node IDs

Draft backend workflow export SHALL assign numeric node IDs sequentially from `1` after the final draft backend node order has been resolved.

#### Scenario: Draft backend export remaps links to numeric IDs

- **WHEN** draft backend export creates embedded next-node references
- **THEN** every embedded reference MUST use the remapped numeric backend node ID
- **AND** no embedded reference may use an editor-domain node ID

#### Scenario: Draft backend export orders incomplete graphs deterministically

- **WHEN** a structurally valid domain workflow draft is exported more than once without changes
- **THEN** draft backend export MUST produce the same backend node order and numeric link references each time

#### Scenario: Draft backend export includes disconnected nodes

- **WHEN** a domain workflow draft contains nodes that are not reachable from any root node
- **THEN** draft backend export MUST include those nodes in the backend `nodes` array

### Requirement: Draft backend export embeds outgoing links in nodes

Draft backend workflow export SHALL encode graph links directly on each backend node using the same backend node link fields as strict backend export.

#### Scenario: Draft regular nodes export next arrays

- **WHEN** a non-evaluator node in a domain workflow draft has outgoing connections
- **THEN** the backend node MUST include `next` containing the numeric backend IDs of its outgoing targets

#### Scenario: Draft terminal regular nodes export empty next arrays

- **WHEN** a non-evaluator node in a domain workflow draft has no outgoing connections
- **THEN** the backend node MUST include `next` as an empty array

#### Scenario: Draft evaluator nodes export scalar branch links

- **WHEN** an evaluator node in a domain workflow draft has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** the backend evaluator node MUST set `next_true` to that target's numeric backend ID
- **WHEN** an evaluator node in a domain workflow draft has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** the backend evaluator node MUST set `next_false` to that target's numeric backend ID

#### Scenario: Draft evaluator nodes export missing branches as null

- **WHEN** an evaluator node in a domain workflow draft has no true or false outgoing connection
- **THEN** the missing backend branch field MUST be `null`

### Requirement: Evaluator outputs accept a single outgoing connection

Workflow connection validation SHALL prevent each evaluator output handle from connecting to more than one target node.

#### Scenario: Existing evaluator true branch blocks another true branch

- **WHEN** an evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** connection validation MUST reject another outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-true`

#### Scenario: Existing evaluator false branch blocks another false branch

- **WHEN** an evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** connection validation MUST reject another outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-false`

#### Scenario: Existing evaluator true branch allows false branch

- **WHEN** an evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** connection validation MUST allow an outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-false` when all other connection rules pass
