## ADDED Requirements

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

#### Scenario: Domain roundtrip preserves setVariable and branch semantics
- **WHEN** a workflow containing setVariable and branch nodes is exported and then imported
- **THEN** semantic config values (including rename/expression-related config) MUST remain equivalent

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
