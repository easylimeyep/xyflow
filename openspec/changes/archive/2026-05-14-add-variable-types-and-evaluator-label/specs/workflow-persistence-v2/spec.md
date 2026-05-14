## ADDED Requirements

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
