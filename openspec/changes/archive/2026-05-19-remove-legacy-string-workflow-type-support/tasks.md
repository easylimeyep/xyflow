## 1. Remove Compatibility Code

- [x] 1.1 Remove Extractor and Setter acceptance/normalization for `variableType: "string"`.
- [x] 1.2 Remove Evaluator operand acceptance/normalization for operand `type: "string"`.
- [x] 1.3 Remove runtime evaluator operator catalog normalization from `string` group keys and `allowTypes` entries to `value`.

## 2. Update Specs and Tests

- [x] 2.1 Update active `rename-string-variable-type-to-value` artifacts so they no longer describe legacy `string` normalization.
- [x] 2.2 Remove tests that expect legacy `string` workflow type literals to normalize to `value`.
- [x] 2.3 Add or update tests to assert `string` workflow type literals are rejected where practical.

## 3. Verification

- [x] 3.1 Sweep `packages/flow/src/workflow` for remaining workflow type metadata literals using `string`, allowing only ordinary JavaScript string validation and explicit rejection fixtures.
- [x] 3.2 Run `pnpm --filter flow exec tsc --noEmit`.
- [x] 3.3 Run `pnpm --filter flow test`.
