## ADDED Requirements

### Requirement: Backend export contracts preserve schema for cyclic graphs
The workflow export layer SHALL serialize workflows containing cycles using the existing Node API v2-aligned backend DTO shape, without introducing schema-breaking field changes.

#### Scenario: Strict export serializes cyclic graph without schema changes
- **WHEN** `exportDomainWorkflowForBackend` receives a domain workflow containing cycle-forming edges
- **THEN** export MUST succeed without cycle-rejection errors
- **AND** exported nodes MUST continue using the existing `next` / `next_true` / `next_false` link fields.

#### Scenario: Draft export format remains unchanged for cyclic graph
- **WHEN** `exportDraftDomainWorkflowForBackend` receives a domain workflow containing cycle-forming edges
- **THEN** export MUST preserve the existing DTO field schema
- **AND** cycle edges MUST be represented through existing node link references.
