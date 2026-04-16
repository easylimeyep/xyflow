## Why

The flow package already contains most of the internal decomposition needed for a flexible editor, but that structure is not exposed as a stable public API. Consumers can mount the editor only through a fixed `Flow` wrapper, which makes it difficult to compose custom layouts, reuse editor parts, or build tailored UI around the same workflow store.

## What Changes

- Introduce `WorkflowEditor` as the new public root component for `@workspace/flow`.
- Make `WorkflowEditor` work in two modes: default composition when no `children` are passed, and provider-only composition when custom `children` are passed.
- Expose a compound component API for the editor shell: `WorkflowEditor.Toolbar`, `WorkflowEditor.Body`, `WorkflowEditor.Palette`, `WorkflowEditor.Canvas`, and `WorkflowEditor.ConfigPanel`.
- Expose the same editor parts as named exports for consumers that prefer direct imports.
- Add a `WorkflowEditor.use` namespace with a compact set of reusable hooks for store access and common editor reads/actions.
- **BREAKING** Remove the legacy `Flow` public component and move initialization entrypoints to `WorkflowEditor`.

## Capabilities

### New Capabilities
- `workflow-editor-compound-api`: public composition API for building default and custom workflow editor layouts from reusable editor parts.

### Modified Capabilities
- `workflow-runtime-context`: runtime initialization contract now applies to `WorkflowEditor` as the public root component and its mount-scoped store lifecycle.

## Impact

- `packages/flow/src/index.tsx`
- `packages/flow/src/workflow/components/workflow-editor/**`
- `packages/flow/src/workflow/components/editor-toolbar/**`
- `packages/flow/src/workflow/components/workflow-canvas/**`
- `packages/flow/src/workflow/components/node-palette/**`
- `packages/flow/src/workflow/components/node-config-panel/**`
- `packages/flow/src/workflow/store/**`
- Public package exports and tests that currently reference `Flow`
