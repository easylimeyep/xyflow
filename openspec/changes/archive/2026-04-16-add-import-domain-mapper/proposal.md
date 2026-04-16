## Why

Workflow export already supports a runtime domain mapper, but import still bypasses any consumer-side transformation and stores the parsed payload as-is after schema conversion. This makes import/export extension asymmetric and prevents consumers from normalizing imported workflow JSON before it is persisted for rendering.

## What Changes

- Add a runtime import-domain mapper alongside the existing export-domain mapper.
- Apply the import mapper to a validated `DomainWorkflowDTO` before converting it into internal graph state and saving it to the store.
- Refactor the import parsing flow so the store can access the validated domain DTO before internal conversion.
- Preserve current behavior when no runtime import mapper is configured.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-persistence-v2`: workflow JSON import gains an optional runtime pre-processing step on the validated domain DTO before internal graph conversion.
- `workflow-runtime-context`: the mount-scoped runtime contract expands to expose symmetric namespaced import/export domain mapping hooks.

## Impact

- Affected code in `packages/flow/src/workflow/store/types.ts`, `packages/flow/src/workflow/store/slices/io-slice.ts`, and `packages/flow/src/workflow/mappers/parser/parser.ts`.
- Public runtime API expands in a backward-compatible way through `WorkflowRuntimeConfig`.
- Import-related tests will need coverage for default behavior, mapper-driven behavior, and invalid mapper output handling.
