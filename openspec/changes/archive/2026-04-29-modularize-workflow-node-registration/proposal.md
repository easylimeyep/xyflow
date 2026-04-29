## Why

Workflow node definitions and their React renderers are currently registered through separate files and a side-effect binding step. Adding or changing a node requires touching a definition file, a component file, the central registry, and `component-bindings.ts`, which makes each node feel split across the codebase and hides part of the registration flow behind mutation.

This change will make each workflow node a cohesive feature module while preserving the existing separation between pure runtime metadata and client-only React rendering.

## What Changes

- Reorganize workflow nodes into feature folders where each node owns its definition, component, tests, and local helpers.
- Replace side-effect component binding with an explicit client-side view registry.
- Keep the pure node registry free of React component imports so store, validation, DTO mapping, graph engine, and tests can continue depending on node metadata without loading UI code.
- Update node type construction to combine pure definitions with the explicit view registry at the canvas/rendering boundary.
- Preserve deterministic fallback rendering for simple nodes without custom components.
- Update affected imports and registry tests to reflect the new module boundaries.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-node-api-v2`: Clarify that the Node API v2 contract is implemented through node-owned modules with separate pure and client entrypoints, and that rendering bindings must be explicit rather than side-effect mutation.

## Impact

- Affected code:
  - `packages/flow/src/workflow/nodes/**`
  - `packages/flow/src/workflow/node-registry/registry.ts`
  - `packages/flow/src/workflow/node-registry/node-types-builder.tsx`
  - `packages/flow/src/workflow/node-registry/component-bindings.ts`
  - workflow node registry and rendering tests
- No user-facing workflow behavior changes are intended.
- No API or dependency changes are expected.
