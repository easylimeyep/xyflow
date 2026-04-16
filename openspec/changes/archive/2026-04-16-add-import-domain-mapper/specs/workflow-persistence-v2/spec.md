## ADDED Requirements

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
