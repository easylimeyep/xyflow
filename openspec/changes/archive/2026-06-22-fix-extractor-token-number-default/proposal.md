## Why

New Extractor nodes default `config.tokenNumber` to `0` in the node definition, but the Extractor UI clamps display to a minimum of `1`. Authors therefore see Token Number `1` while persisted store state and backend export still carry `0`, and blur without edits never reconciles the mismatch.

## What Changes

- Change Extractor `buildDefaultConfig` so `tokenNumber` defaults to `1` instead of `0`.
- Align regression coverage and any tests that assume the old default of `0` for newly created extractor nodes.
- Keep the existing UI display clamp (`Math.max(1, …)`) and commit-on-blur behavior unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-variable-config`: Extractor default `tokenNumber` persisted config must be `1` so UI, store, and backend export agree for newly created nodes.

## Impact

- `packages/flow/src/workflow/nodes/data/extractor/definition.ts`
- `packages/flow/src/workflow/nodes/data/extractor/component.test.tsx`
- Tests and fixtures that create extractor nodes without an explicit `tokenNumber` and expect `0`
- Backend transform output for freshly added extractor nodes
