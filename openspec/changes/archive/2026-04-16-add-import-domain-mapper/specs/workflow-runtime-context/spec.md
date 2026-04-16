## ADDED Requirements

### Requirement: Runtime configuration provides symmetric domain mapping hooks
The workflow runtime configuration SHALL expose namespaced domain mapping hooks for both export and import operations. The import hook MUST be available under the same mount-scoped runtime contract as the export hook and MUST remain optional.

#### Scenario: Consumer omits import-domain runtime configuration
- **WHEN** a consumer renders `WorkflowEditor` without `runtime.importDomain`
- **THEN** the workflow store MUST initialize successfully with default import behavior

#### Scenario: Consumer provides import-domain runtime configuration at mount
- **WHEN** a consumer renders `WorkflowEditor` with `runtime.importDomain.mapper`
- **THEN** the workflow store MUST initialize with that mapper available to runtime-aware import commands

#### Scenario: Runtime mapping hooks remain mount-scoped
- **WHEN** `WorkflowEditor` rerenders after store creation with a different `runtime.importDomain` mapper
- **THEN** the existing store instance MUST continue using the import mapper from its initial mount
