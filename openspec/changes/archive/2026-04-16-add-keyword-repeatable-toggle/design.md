## Context

`Keyword` is implemented as the `inlineExpression` node kind. Its editable behavior is defined in three places: the node registry definition (`definition.ts`), the rendered node UI (`inline-expression-node.tsx`), and the shared workflow config types (`types.ts`). The node already follows this pattern for the `Root` checkbox, so the safest implementation is to extend the same config-driven approach with one more boolean flag.

## Goals / Non-Goals

**Goals:**
- Add a `Repeatable` checkbox directly below the `Tokens` input in the `Keyword` node body.
- Persist the checkbox as typed node config so the value survives store updates and future serialization.
- Cover the new behavior with focused node-level and config-shape tests.

**Non-Goals:**
- Change runtime execution semantics for keywords beyond storing the flag.
- Rework the node shell layout or move the existing `Root` control from the header.
- Introduce workflow migration logic for older saved graphs unless type validation requires it later.

## Decisions

### Decision: Reuse the existing config-driven node field model
The `inlineExpression` definition already declares `template` and `isRoot`, plus defaults and validation. Adding `repeatable` there keeps registry metadata, defaults, and validation aligned with the UI.

Alternatives considered:
- Store `repeatable` only in the rendered component state. Rejected because it would not persist in workflow state.
- Add a separate node kind for repeatable keywords. Rejected because the change is only an optional boolean on the existing keyword node.

### Decision: Render `Repeatable` in the node body under `Tokens`
The request is specifically to place the checkbox under the tokens input. Keeping it in the body separates content behavior (`Repeatable`) from graph-topology behavior (`Root` in the header).

Alternatives considered:
- Put `Repeatable` beside `Root` in the header. Rejected because it does not match the requested placement and would blur two different concerns.

### Decision: Default to `false`
Existing workflows and newly created nodes should remain non-repeatable unless the user explicitly enables the option. This preserves current behavior and avoids accidental semantic changes.

Alternatives considered:
- Default to `true`. Rejected because it would silently change the meaning of newly created keywords.

## Risks / Trade-offs

- [Stored flag without runtime consumer] -> This change may only persist UI state for now; document that runtime behavior is out of scope so the checkbox is treated as authoring metadata until consumed elsewhere.
- [Config type drift] -> Update type definition, default config, and validation together so store operations cannot accept invalid shapes.
- [UI regression in node layout] -> Keep the checkbox in the existing edit field block and extend the current node test coverage to verify placement and updates.

## Migration Plan

No explicit migration is planned. New nodes will initialize `repeatable` to `false`, and existing persisted workflows can continue to omit the field until a future import normalization pass adds it if needed.

## Open Questions

- Whether downstream workflow execution or export layers should eventually consume `repeatable` is intentionally left for a follow-up change.
