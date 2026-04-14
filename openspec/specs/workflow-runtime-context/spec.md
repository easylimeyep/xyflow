# workflow-runtime-context Specification

## Purpose
Define the mount-scoped runtime configuration contract for workflow consumers so external integrations can extend workflow behavior through a typed, namespaced API.

## Requirements
### Requirement: Workflow store accepts namespaced runtime configuration
The workflow runtime SHALL accept an optional typed runtime configuration object during `Flow` / `WorkflowStoreProvider` initialization. This configuration MUST be namespaced under a single runtime contract rather than exposed as unrelated top-level provider props.

#### Scenario: Consumer omits runtime configuration
- **WHEN** a consumer renders the workflow without passing runtime configuration
- **THEN** the workflow MUST initialize successfully with the existing default behavior

#### Scenario: Consumer passes runtime configuration at mount
- **WHEN** a consumer renders the workflow with a runtime configuration object
- **THEN** the workflow store MUST initialize with that configuration available to runtime-aware commands and UI integrations

### Requirement: Runtime configuration is mount-scoped and immutable for a store instance
Runtime configuration SHALL be treated as mount-time initialization data for a workflow store instance. Re-rendering the provider with different runtime props MUST NOT mutate the existing store instance.

#### Scenario: Provider rerenders with different runtime config
- **WHEN** the provider rerenders after the store has already been created
- **THEN** the existing store instance MUST continue using the runtime configuration from its initial mount

#### Scenario: New provider mount gets a fresh runtime config
- **WHEN** a new workflow provider instance mounts with a different runtime configuration
- **THEN** the new store instance MUST use the new runtime configuration without leaking settings from the previous instance
