# workflow-persistence-v2 Specification

## Purpose

TBD - created by archiving change rebuild-flow-node-api-v2. Update Purpose after archive.

## Requirements

### Requirement: Domain and clipboard codecs are schema-driven

Workflow domain import/export and clipboard import/export SHALL validate and normalize node config through node schema contracts rather than field-list-only coercion.

#### Scenario: Domain import normalizes config by schema

- **WHEN** a workflow is imported from domain JSON
- **THEN** each node config MUST be normalized by its node schema contract

#### Scenario: Clipboard paste normalizes config by schema

- **WHEN** nodes are pasted from clipboard payload
- **THEN** pasted node configs MUST be normalized by their node schema contracts

### Requirement: Roundtrips preserve semantic config values

Persistence codecs SHALL preserve semantic node config values for supported node kinds across export/import and copy/paste roundtrips.

#### Scenario: Domain roundtrip preserves setVariable and evaluator semantics

- **WHEN** a workflow containing setVariable and evaluator nodes is exported and then imported
- **THEN** semantic config values (including rename/expression-related config) MUST remain equivalent
- **AND** evaluator edge handles MUST remain `evaluator-true` and `evaluator-false`

#### Scenario: Clipboard roundtrip preserves local subgraph semantics

- **WHEN** a selected subgraph is copied and pasted
- **THEN** pasted nodes MUST preserve semantic config values and internal edge semantics

### Requirement: Invalid persistence payloads fail deterministically

The codec layer SHALL reject malformed payloads deterministically with explicit validation failure outcomes.

#### Scenario: Unknown node kind is rejected

- **WHEN** imported payload references an unsupported node kind
- **THEN** import MUST fail with explicit schema-validation failure

#### Scenario: Schema-invalid config value is rejected or normalized by explicit policy

- **WHEN** payload contains config values that violate node schema
- **THEN** codec behavior MUST follow explicit schema policy and MUST NOT silently produce ambiguous state

### Requirement: Legacy branch payloads are unsupported

Persistence codecs SHALL treat `branch` as an unsupported node kind after the evaluator rename.

#### Scenario: Domain import rejects branch payloads

- **WHEN** an imported workflow payload contains a node with kind `branch`
- **THEN** import MUST fail through the unsupported-node-kind validation path

#### Scenario: Clipboard import rejects branch payloads

- **WHEN** a clipboard payload contains a node with kind `branch`
- **THEN** paste MUST fail through the unsupported-node-kind validation path

### Requirement: Domain export supports optional runtime post-processing

Workflow domain export SHALL support an optional runtime post-processing step that runs after the built-in schema-driven export codec has produced the default domain DTO and before that DTO is serialized to JSON. This hook MUST receive the same domain object that default export behavior would otherwise serialize.

#### Scenario: Domain export without runtime mapper uses default payload

- **WHEN** domain export is executed without a configured runtime export mapper
- **THEN** the returned payload MUST equal the default schema-driven export output

#### Scenario: Domain export with runtime mapper returns transformed payload

- **WHEN** domain export is executed with a configured runtime export mapper
- **THEN** the mapper MUST receive the default domain DTO
- **AND** the final export result MUST equal the JSON serialization of the mapper return value

#### Scenario: Runtime mapper does not replace the internal export codec

- **WHEN** a runtime export mapper is configured
- **THEN** the built-in domain export codec MUST still run first to produce the canonical base DTO before post-processing is applied

### Requirement: Domain import supports optional runtime pre-processing

Workflow domain import SHALL support an optional runtime pre-processing step that runs after the built-in JSON parsing and schema-driven domain validation have produced the default `DomainWorkflowDTO`, and before that DTO is converted into internal workflow graph state. This hook MUST receive the same validated domain object that default import behavior would otherwise convert.

#### Scenario: Domain import without runtime mapper uses default payload

- **WHEN** domain import is executed without a configured runtime import mapper
- **THEN** the imported graph MUST be produced from the default validated domain DTO

#### Scenario: Domain import with runtime mapper uses transformed payload

- **WHEN** domain import is executed with a configured runtime import mapper
- **THEN** the mapper MUST receive the default validated domain DTO
- **AND** the imported graph MUST be produced from the mapper return value

#### Scenario: Runtime import mapper output is validated before graph conversion

- **WHEN** a runtime import mapper returns a payload that does not satisfy the domain workflow schema
- **THEN** import MUST fail through the invalid-schema error path
- **AND** the store MUST NOT persist partial graph state from the invalid mapper output

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

### Requirement: Variable metadata persists across workflow codecs
Workflow domain import/export, clipboard import/export, and backend export SHALL preserve supported variable metadata stored in node config.

#### Scenario: Domain roundtrip preserves variable metadata
- **WHEN** a workflow containing extractor `variableType`, setter `clear`, and evaluator `label` config is exported to domain JSON and imported back
- **THEN** the restored node configs MUST preserve those values

#### Scenario: Clipboard roundtrip preserves variable metadata
- **WHEN** a selected subgraph containing extractor `variableType`, setter `clear`, and evaluator `label` config is copied and pasted
- **THEN** the pasted node configs MUST preserve those values

#### Scenario: Backend export includes variable metadata
- **WHEN** a domain workflow containing extractor `variableType`, setter `clear`, and evaluator `label` config is exported for backend consumption
- **THEN** the backend node configs MUST include those values unchanged

#### Scenario: Legacy payloads receive variable metadata defaults
- **WHEN** an imported legacy payload omits extractor `variableType`, setter `clear`, or evaluator `label`
- **THEN** config normalization MUST apply the node definition defaults for the missing fields
