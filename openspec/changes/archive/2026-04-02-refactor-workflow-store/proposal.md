## Why

The workflow store has accumulated correctness issues (module-level mutable state that breaks SSR and test isolation), structural coupling (graph slices directly importing from the expression domain), and maintenance debt (large monolithic slices, duplicated logic, hardcoded magic values). These make the store harder to test, extend, and reason about as the codebase grows.

## What Changes

- Remove module-level mutable selector cache in `selectors.ts`; move expression variable catalog caching into Zustand store state
- Introduce a `store/graph-refactors.ts` coordination file so graph slices no longer import directly from `workflow/expression/refactor/`
- Eliminate code duplication in `history-slice.ts`, `selection-slice.ts`, `naming.ts`, and `io-slice.ts` by extracting shared private helpers
- Decompose `graph-slice.ts` (419 lines) into focused sub-slices: `node-crud-slice`, `connection-slice`, `nodes-change-slice`
- Extract pure helper functions from `onNodesChange` and `pasteFromClipboard` to reduce complexity
- Add `extraExpressionConfigKeys` and `renameConfigKey` fields to `NodeDefinition` to eliminate hardcoded `setVariable` kind checks
- Extract named constants from `geometry.ts` into `geometry-constants.ts` and add `DEFAULT_NODE_HEIGHT` to `node-factory.ts`
- Consolidate multiple store subscriptions in `OutputQuickAddAffordance` and `CanvasContainer`
- Remove the `() => true` equality hack on the viewport subscription in `workflow-editor.tsx`

## Capabilities

### New Capabilities

- `store-expression-cache`: Expression variable catalog caching moved into per-store Zustand state (replaces module-level variables)
- `store-slice-decomposition`: `graph-slice` split into focused sub-slices with extracted helpers
- `store-extensible-node-config`: `NodeDefinition` extended with `renameConfigKey` and `extraExpressionConfigKeys` for type-safe, extensible per-kind configuration hooks

### Modified Capabilities

<!-- No existing spec-level behavioral requirements are changing — this is a pure internal refactor -->

## Impact

- `packages/flow/src/workflow/store/` — all slice files, helpers, selectors, and types
- `packages/flow/src/workflow/node-registry/define-node.ts` — extended type
- `packages/flow/src/workflow/nodes/data/set-variable/definition.ts` — adopts new fields
- `packages/flow/src/workflow/expression/refactor/refactor.ts` — reads from definition instead of hardcoded kind
- `packages/flow/src/workflow/components/workflow-editor/workflow-editor.tsx` — subscription consolidation
- `packages/flow/src/workflow/nodes/output-quick-add-affordance/output-quick-add-affordance.tsx` — subscription consolidation
- No public API or behavioral changes; all tests must continue to pass
