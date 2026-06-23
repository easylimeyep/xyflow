## Why

The `extractor` node currently pre-fills its input with a default `value`, which adds noise and can mislead users into treating example content as actual configuration. Replacing that default with a placeholder improves clarity and makes the initial state intentionally empty.

## What Changes

- Remove the default `value` from the `extractor` node field that is currently auto-populated.
- Add a descriptive `placeholder` for that field so users still get guidance without persisted default content.
- Preserve existing editing and save behavior once a user enters their own value.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workflow-node-api-v2`: Update node field defaults for `extractor` so the field initializes empty and uses placeholder text instead of a pre-set value.

## Impact

- Affected code: extractor node definition/default data and related field rendering logic in `packages/flow`.
- Affected tests: node defaults/UI expectations where `extractor` currently assumes a default `value`.
- No API or dependency changes expected.
