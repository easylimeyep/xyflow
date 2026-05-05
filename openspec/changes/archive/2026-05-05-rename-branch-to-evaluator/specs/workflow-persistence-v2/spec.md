## MODIFIED Requirements

### Requirement: Roundtrips preserve semantic config values

Persistence codecs SHALL preserve semantic node config values for supported node kinds across export/import and copy/paste roundtrips.

#### Scenario: Domain roundtrip preserves setVariable and evaluator semantics

- **WHEN** a workflow containing setVariable and evaluator nodes is exported and then imported
- **THEN** semantic config values (including rename/expression-related config) MUST remain equivalent
- **AND** evaluator edge handles MUST remain `evaluator-true` and `evaluator-false`

#### Scenario: Clipboard roundtrip preserves local subgraph semantics

- **WHEN** a selected subgraph is copied and pasted
- **THEN** pasted nodes MUST preserve semantic config values and internal edge semantics

## ADDED Requirements

### Requirement: Legacy branch payloads are unsupported

Persistence codecs SHALL treat `branch` as an unsupported node kind after the evaluator rename.

#### Scenario: Domain import rejects branch payloads

- **WHEN** an imported workflow payload contains a node with kind `branch`
- **THEN** import MUST fail through the unsupported-node-kind validation path

#### Scenario: Clipboard import rejects branch payloads

- **WHEN** a clipboard payload contains a node with kind `branch`
- **THEN** paste MUST fail through the unsupported-node-kind validation path
