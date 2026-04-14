## ADDED Requirements

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
