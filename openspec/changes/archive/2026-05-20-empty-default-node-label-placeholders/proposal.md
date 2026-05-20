## Why

New Evaluator and Setter nodes currently start with concrete variable identifiers (`conditionMatched` and `myVar`). That makes freshly added nodes look configured before the author has made a naming decision, and it can leak placeholder-like names into downstream variable catalogs, expression refactors, clipboard fixtures, and exported workflow payloads.

Keyword token rows also use `{{ myVariable }}` as their placeholder, which nudges authors toward expression syntax even when the field accepts a literal token. The authoring experience should make empty variable labels truly empty while still showing useful placeholder guidance.

## What Changes

- Change Evaluator default result label from `conditionMatched` to an empty string.
- Keep Evaluator Label input visibly guided with a placeholder, but do not use that placeholder as the stored value or runtime fallback.
- Ensure Evaluator does not expose a downstream result variable until the author provides a valid label.
- Change Setter default variable name from `myVar` to an empty string.
- Keep Setter Label input guided by placeholder text instead of a stored default value.
- Change Keyword token row placeholder from `{{ myVariable }}` to `token`.
- Update tests and fixtures that asserted the old default stored values or old keyword placeholder.

## Capabilities

### Modified Capabilities

- `workflow-evaluator-node`: Evaluator result label defaults and downstream variable exposure.
- `workflow-variable-config`: Setter variable identifier default config.
- `variable-label-input-unification`: Label input placeholder-vs-value behavior.
- `keyword-tagged-input`: Keyword token placeholder guidance.

## Impact

- Affected node definitions: Evaluator, Setter, Keyword.
- Affected node UIs: Evaluator Label input, Setter Label input, Keyword token expression rows.
- Affected variable discovery: empty Evaluator labels should not appear as downstream variables.
- Affected persistence/import behavior: missing Evaluator/Setter label keys normalize to empty strings rather than example identifiers.
- Affected tests: component tests, registry/default config tests, variable discovery/refactor tests, clipboard/domain fixture expectations.
