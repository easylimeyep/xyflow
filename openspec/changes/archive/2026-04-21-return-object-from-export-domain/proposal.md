## Why

`exportDomain` currently returns a pre-serialized JSON string, which forces all consumers into one transport format and removes the option to apply their own serialization strategy.
The export API should return a ready domain object so callers can decide if and how to serialize it.

## What Changes

- Change `exportDomain` to return a mapped domain object instead of `JSON.stringify(...)` output.
- Keep runtime export mapping behavior (`runtime.exportDomain.mapper`) but make it object-in/object-out.
- Move string serialization to call sites that explicitly need text output (for example clipboard/export UI).
- Update TypeScript signatures and affected tests to match the new return contract.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workflow-runtime-context`: `exportDomain` runtime flow now returns a domain object and does not perform built-in JSON string serialization.

## Impact

- Affected code: workflow store IO slice, store public types, toolbar/export call sites, store/editor tests.
- API impact: `exportDomain` return type changes from `string` to domain DTO object.
- No new dependencies.
