## Why

`Keyword` already stores editable token input directly on the node, but it does not expose whether the keyword should be treated as repeatable. That forces users to infer repeatability elsewhere or leaves the workflow model unable to capture an important part of keyword behavior in the node itself.

## What Changes

- Add a `Repeatable` boolean control to the `Keyword` node UI below the `Tokens` input.
- Persist the checkbox value in the `inlineExpression` node config with a typed boolean field.
- Ensure new `Keyword` nodes default to a non-repeatable state unless explicitly enabled.
- Add or update tests covering rendering, config updates, and default config shape for the new flag.

## Capabilities

### New Capabilities
- `keyword-repeatable-toggle`: Allow `Keyword` nodes to expose and persist a repeatable boolean option alongside token editing.

### Modified Capabilities
<!-- None. -->

## Impact

- Affected code in `packages/flow/src/workflow/nodes/data/inline-expression/`
- Affected workflow config typing in `packages/flow/src/workflow/types/types.ts`
- Affected node registry definition in `packages/flow/src/workflow/nodes/data/inline-expression/definition.ts`
- Affected node-level tests for `InlineExpressionNode`
