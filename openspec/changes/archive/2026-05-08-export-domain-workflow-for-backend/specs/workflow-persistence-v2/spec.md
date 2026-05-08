## ADDED Requirements

### Requirement: Domain workflows export to backend execution DTOs

The workflow mapper layer SHALL provide an `exportDomainWorkflowForBackend` utility that converts a validated `DomainWorkflowDTO` into a `BackendWorkflowDTO` without changing the existing domain import/export contract.

#### Scenario: Backend export preserves workflow document fields
- **WHEN** a domain workflow is exported for backend consumption
- **THEN** the backend DTO MUST preserve the workflow `id`, `name`, `version`, and `metadata`
- **AND** the backend DTO MUST contain a `nodes` array of backend workflow nodes

#### Scenario: Backend export preserves node semantic fields
- **WHEN** a domain workflow node is exported for backend consumption
- **THEN** the backend node MUST preserve the node `kind`, `position`, `label`, and `config`
- **AND** the backend node id MUST be a number assigned by backend export order

### Requirement: Backend export assigns deterministic numeric node IDs

Backend workflow export SHALL assign numeric node IDs sequentially from `1` after the final backend node order has been resolved.

#### Scenario: Linear graph receives sequential IDs
- **WHEN** a linear workflow is exported for backend consumption
- **THEN** the first ordered backend node MUST have `id` equal to `1`
- **AND** each following backend node MUST have an `id` equal to the previous backend node id plus `1`

#### Scenario: Existing editor IDs are remapped in links
- **WHEN** backend export creates embedded next-node references
- **THEN** every embedded reference MUST use the remapped numeric backend node ID
- **AND** no embedded reference may use an editor-domain node ID

### Requirement: Backend export orders nodes by graph topology

Backend workflow export SHALL derive node order from graph connections, not from the incoming `DomainWorkflowDTO.nodes` array order.

#### Scenario: Roots seed backend ordering
- **WHEN** multiple root nodes exist
- **THEN** backend export MUST seed ordering with all nodes where `kind` is `inlineExpression` and `config.isRoot` is `true`
- **AND** root nodes MUST be sorted by `position.x`, then `position.y`, then `label`, then editor node `id`

#### Scenario: Shared downstream nodes wait for all parents
- **WHEN** two or more root paths converge into the same downstream node
- **THEN** backend export MUST emit all available upstream parent nodes before the shared downstream node
- **AND** the shared downstream node MUST appear only once in the backend `nodes` array

#### Scenario: Outgoing traversal is deterministic
- **WHEN** a processed node makes multiple downstream nodes available
- **THEN** backend export MUST sort available downstream nodes by source handle priority, target `position.x`, target `position.y`, target `label`, and target editor `id`

### Requirement: Backend export embeds outgoing links in nodes

Backend workflow export SHALL encode graph links directly on each backend node.

#### Scenario: Regular nodes export next arrays
- **WHEN** a non-evaluator node has outgoing connections
- **THEN** the backend node MUST include `next` containing the numeric backend IDs of its outgoing targets

#### Scenario: Terminal regular nodes export empty next arrays
- **WHEN** a non-evaluator node has no outgoing connections
- **THEN** the backend node MUST include `next` as an empty array

#### Scenario: Evaluator nodes export scalar branch links
- **WHEN** an evaluator node has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** the backend evaluator node MUST set `next_true` to that target's numeric backend ID
- **WHEN** an evaluator node has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** the backend evaluator node MUST set `next_false` to that target's numeric backend ID

#### Scenario: Missing evaluator branches export null
- **WHEN** an evaluator node has no true or false outgoing connection
- **THEN** the missing backend branch field MUST be `null`

### Requirement: Backend export rejects non-exportable graphs

Backend workflow export SHALL fail with explicit validation errors instead of producing a partial or ambiguous backend DTO when the domain workflow graph is not exportable.

#### Scenario: Workflow without roots is rejected
- **WHEN** a domain workflow contains no node where `kind` is `inlineExpression` and `config.isRoot` is `true`
- **THEN** backend export MUST fail with a validation error

#### Scenario: Root with incoming connection is rejected
- **WHEN** a root node has one or more incoming connections
- **THEN** backend export MUST fail with a validation error

#### Scenario: Unknown edge endpoints are rejected
- **WHEN** a connection references a source or target node ID that is absent from the domain workflow nodes
- **THEN** backend export MUST fail with a validation error

#### Scenario: Unreachable nodes are rejected
- **WHEN** a node cannot be reached from any root node through graph connections
- **THEN** backend export MUST fail with a validation error

#### Scenario: Cyclic graphs are rejected
- **WHEN** backend export cannot topologically order all reachable nodes
- **THEN** backend export MUST fail with a validation error

#### Scenario: Duplicate evaluator branches are rejected
- **WHEN** an evaluator node has more than one outgoing `evaluator-true` connection or more than one outgoing `evaluator-false` connection
- **THEN** backend export MUST fail with a validation error
