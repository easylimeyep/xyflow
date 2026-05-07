# Design

## UI Placement

`caseSensitive` is a node-level matching option, so it should not live inside each keyword token row or evaluator condition row.

For `Keyword`, place the checkbox in the existing options area below `Tokens`, next to or directly after `Repeatable`. This keeps token content editing separate from matching modifiers and follows the established `Repeatable` pattern in `InlineExpressionNode`.

For `Evaluator`, place the checkbox below the condition list and above the `+ Add Condition` action. In single-condition mode this still reads as an option for the visible comparison; in multi-condition mode it clearly applies to the whole evaluator node rather than one condition.

## Config Shape

Extend:

- `InlineExpressionNodeConfig` with `caseSensitive: boolean`
- `EvaluatorNodeConfig` with `caseSensitive: boolean`

Use the correctly spelled backend-facing key `caseSensitive` and the visible label `Case sensitive` consistently across UI, config, and tests.

Default config values and normalization should set missing values to `false`. Toggle handlers should write explicit booleans through `updateNodeConfig`, matching existing `isRoot` and `repeatable` updates.

## Persistence

The existing schema-driven node config normalization and semantic roundtrip tests should include the new boolean field for both node kinds. Importing older payloads without the field should continue to work and should hydrate `caseSensitive: false`.

## Tests

Add focused component tests for both nodes:

- checkbox renders in the intended location
- enabling writes `caseSensitive: true`
- disabling writes `caseSensitive: false`

Update registry/default config tests and persistence/clipboard roundtrip coverage so the field is not dropped.

## Risks

- Evaluator multi-condition mode may make users wonder if sensitivity is per-condition. Mitigation: keep the checkbox outside `ConditionRow` and below the whole condition list.
