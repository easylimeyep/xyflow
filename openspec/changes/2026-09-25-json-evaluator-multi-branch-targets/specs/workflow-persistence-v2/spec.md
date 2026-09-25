## MODIFIED Requirements

### Requirement: Domain workflows export to backend execution DTOs

The workflow mapper layer SHALL provide an `exportDomainWorkflowForBackend` utility that converts a validated `DomainWorkflowDTO` into a `BackendWorkflowDTO` without changing the existing domain import/export contract. The utility SHALL take the editor's node registry as its first argument and the domain workflow as its second, because the registry decides how each evaluator kind's branches serialize.

#### Scenario: Backend export preserves workflow document fields

- **WHEN** a domain workflow is exported for backend consumption
- **THEN** the backend DTO MUST preserve the workflow `id`, `name`, `version`, and `metadata`
- **AND** the backend DTO MUST contain a `nodes` array of backend workflow nodes

#### Scenario: Backend export preserves node semantic fields

- **WHEN** a domain workflow node is exported for backend consumption
- **THEN** the backend node MUST preserve the node `kind`, `position`, `label`, and `config`
- **AND** the backend node id MUST be a number assigned by backend export order

#### Scenario: Backend export reads branch fan-out from the registry it is handed

- **WHEN** the same domain workflow is exported with two registries that disagree on whether an evaluator kind fans out its branches
- **THEN** each export MUST serialize that kind's branches according to the registry it was handed

### Requirement: Backend export embeds outgoing links in nodes

Backend workflow export SHALL encode graph links directly on each backend node. An evaluator kind whose definition declares branch fan-out is a multi-target evaluator; every other evaluator kind is a single-target evaluator.

#### Scenario: Regular nodes export next arrays

- **WHEN** a non-evaluator node has outgoing connections
- **THEN** the backend node MUST include `next` containing the numeric backend IDs of its outgoing targets

#### Scenario: Terminal regular nodes export empty next arrays

- **WHEN** a non-evaluator node has no outgoing connections
- **THEN** the backend node MUST include `next` as an empty array

#### Scenario: Evaluator nodes export scalar branch links

- **WHEN** a single-target evaluator node has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** the backend evaluator node MUST set `next_true` to that target's numeric backend ID
- **WHEN** a single-target evaluator node has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** the backend evaluator node MUST set `next_false` to that target's numeric backend ID

#### Scenario: Missing evaluator branches export null

- **WHEN** a single-target evaluator node has no true or false outgoing connection
- **THEN** the missing backend branch field MUST be `null`

#### Scenario: Multi-target evaluator nodes export branch link lists

- **WHEN** a multi-target evaluator node has one or more outgoing connections with `sourceHandle` equal to `evaluator-true`
- **THEN** the backend evaluator node MUST set `next_true` to an array of those targets' numeric backend IDs, in backend export order
- **WHEN** a multi-target evaluator node has one or more outgoing connections with `sourceHandle` equal to `evaluator-false`
- **THEN** the backend evaluator node MUST set `next_false` to an array of those targets' numeric backend IDs, in backend export order

#### Scenario: Missing multi-target evaluator branches export empty lists

- **WHEN** a multi-target evaluator node has no true or no false outgoing connection
- **THEN** the missing backend branch field MUST be an empty array, never `null`

#### Scenario: The JSON Evaluator is a multi-target evaluator by default

- **WHEN** a workflow is exported with the built-in node definitions
- **THEN** `jsonEvaluator` nodes MUST export branch link lists
- **AND** `evaluator` nodes MUST export scalar branch links

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

- **WHEN** a single-target evaluator node has more than one outgoing `evaluator-true` connection or more than one outgoing `evaluator-false` connection
- **THEN** backend export MUST fail with a validation error

#### Scenario: Several multi-target evaluator branch targets are accepted

- **WHEN** a multi-target evaluator node has more than one outgoing `evaluator-true` connection or more than one outgoing `evaluator-false` connection
- **THEN** backend export MUST NOT fail on account of those connections

### Requirement: Domain workflow drafts export to backend persistence DTOs

The workflow mapper layer SHALL provide an `exportDraftDomainWorkflowForBackend` utility that converts a structurally valid `DomainWorkflowDTO` into a `BackendWorkflowDTO` without requiring the workflow to be execution-ready. The utility SHALL take the editor's node registry as its first argument and the domain workflow draft as its second.

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

### Requirement: Draft backend export embeds outgoing links in nodes

Draft backend workflow export SHALL encode graph links directly on each backend node using the same backend node link fields as strict backend export, including the single-target and multi-target evaluator shapes.

#### Scenario: Draft regular nodes export next arrays

- **WHEN** a non-evaluator node in a domain workflow draft has outgoing connections
- **THEN** the backend node MUST include `next` containing the numeric backend IDs of its outgoing targets

#### Scenario: Draft terminal regular nodes export empty next arrays

- **WHEN** a non-evaluator node in a domain workflow draft has no outgoing connections
- **THEN** the backend node MUST include `next` as an empty array

#### Scenario: Draft evaluator nodes export scalar branch links

- **WHEN** a single-target evaluator node in a domain workflow draft has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** the backend evaluator node MUST set `next_true` to that target's numeric backend ID
- **WHEN** a single-target evaluator node in a domain workflow draft has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** the backend evaluator node MUST set `next_false` to that target's numeric backend ID

#### Scenario: Draft evaluator nodes export missing branches as null

- **WHEN** a single-target evaluator node in a domain workflow draft has no true or false outgoing connection
- **THEN** the missing backend branch field MUST be `null`

#### Scenario: Draft multi-target evaluator nodes keep every branch target

- **WHEN** a multi-target evaluator node in a domain workflow draft has several outgoing connections on one branch handle
- **THEN** the matching backend branch field MUST list every one of those targets' numeric backend IDs
- **AND** a branch with no outgoing connection MUST export as an empty array

### Requirement: Evaluator outputs accept a single outgoing connection

Workflow connection validation SHALL prevent each output handle of a single-target evaluator from connecting to more than one target node.

#### Scenario: Existing evaluator true branch blocks another true branch

- **WHEN** a single-target evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** connection validation MUST reject another outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-true`

#### Scenario: Existing evaluator false branch blocks another false branch

- **WHEN** a single-target evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** connection validation MUST reject another outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-false`

#### Scenario: Existing evaluator true branch allows false branch

- **WHEN** an evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** connection validation MUST allow an outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-false` when all other connection rules pass

## ADDED Requirements

### Requirement: Multi-target evaluator outputs accept several outgoing connections

Workflow connection validation SHALL let each output handle of a multi-target evaluator connect to any number of distinct target nodes. Whether an evaluator kind is multi-target SHALL be read from the node definition the editor was given, never from a fixed list of kinds, and only a kind with `evaluator-true` / `evaluator-false` handles can be multi-target.

#### Scenario: Existing multi-target true branch allows another true branch

- **WHEN** a multi-target evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-true`
- **THEN** connection validation MUST allow another outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-true` to a different target when all other connection rules pass

#### Scenario: Existing multi-target false branch allows another false branch

- **WHEN** a multi-target evaluator node already has an outgoing connection with `sourceHandle` equal to `evaluator-false`
- **THEN** connection validation MUST allow another outgoing connection from the same evaluator with `sourceHandle` equal to `evaluator-false` to a different target when all other connection rules pass

#### Scenario: Multi-target branch still rejects an exact duplicate

- **WHEN** a multi-target evaluator node already has an outgoing connection to a target on a branch handle
- **THEN** connection validation MUST reject a second connection to the same target on the same branch handle

#### Scenario: A host can make the JSON Evaluator single-target again

- **WHEN** a host hands the editor a `jsonEvaluator` definition that does not declare branch fan-out
- **THEN** `jsonEvaluator` outputs MUST follow the single-outgoing-connection rule
- **AND** backend export MUST serialize its branches as scalar links

#### Scenario: Fan-out declared on a non-branching kind has no effect

- **WHEN** a node kind without `evaluator-true` / `evaluator-false` handles declares branch fan-out
- **THEN** connection validation, branch quick-add and backend export MUST treat that kind as if it did not
