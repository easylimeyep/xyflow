## MODIFIED Requirements

### Requirement: Runtime configuration provides symmetric domain mapping hooks
The workflow runtime configuration SHALL expose namespaced domain mapping hooks for both export and import operations. The import hook MUST be available under the same mount-scoped runtime contract as the export hook and MUST remain optional. The store export command MUST return a domain object (post-mapper when configured) and MUST NOT pre-serialize that object into a JSON string.

#### Scenario: Consumer omits import-domain runtime configuration
- **WHEN** a consumer renders `WorkflowEditor` without `runtime.importDomain`
- **THEN** the workflow store MUST initialize successfully with default import behavior

#### Scenario: Consumer provides import-domain runtime configuration at mount
- **WHEN** a consumer renders `WorkflowEditor` with `runtime.importDomain.mapper`
- **THEN** the workflow store MUST initialize with that mapper available to runtime-aware import commands

#### Scenario: Runtime mapping hooks remain mount-scoped
- **WHEN** `WorkflowEditor` rerenders after store creation with a different `runtime.importDomain` mapper
- **THEN** the existing store instance MUST continue using the import mapper from its initial mount

#### Scenario: Export command returns domain object without runtime mapper
- **WHEN** a consumer calls `exportDomain` and `runtime.exportDomain.mapper` is not configured
- **THEN** the command MUST return the base domain DTO object
- **AND** the returned value MUST NOT be a pre-serialized JSON string

#### Scenario: Export command returns mapped domain object
- **WHEN** a consumer calls `exportDomain` and `runtime.exportDomain.mapper` is configured
- **THEN** the command MUST return the mapper output as an object
- **AND** serialization format MUST remain the caller's responsibility
