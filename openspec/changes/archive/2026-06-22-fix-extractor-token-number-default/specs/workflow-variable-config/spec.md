## ADDED Requirements

### Requirement: Extractor defaults token number to one

Extractor nodes SHALL persist a numeric `tokenNumber` config value. Newly created extractor nodes MUST default `config.tokenNumber` to `1` so persisted store state matches the Extractor Token Number UI and backend export for untouched nodes.

#### Scenario: New extractor node defaults token number to one

- **WHEN** an extractor node is created from the node palette without an explicit `tokenNumber` override
- **THEN** the extractor config MUST include `tokenNumber` equal to `1`

#### Scenario: Backend export preserves default token number

- **WHEN** a workflow containing a newly created extractor node is exported for backend consumption without editing Token Number
- **THEN** the exported extractor node config MUST include `tokenNumber` equal to `1`

#### Scenario: Extractor UI matches stored default token number

- **WHEN** an extractor node editor is rendered for a node created with default config and Token Number has not been edited
- **THEN** the Token Number input MUST display `1`
- **AND** the stored extractor config MUST include `tokenNumber` equal to `1`
