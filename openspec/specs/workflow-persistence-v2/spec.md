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
