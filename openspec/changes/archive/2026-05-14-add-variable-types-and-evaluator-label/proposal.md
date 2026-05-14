## Why

Workflow variable-producing nodes need to carry more execution metadata than just the variable identifier. Extractor outputs must declare whether they produce a string or array, setter nodes need an explicit clear-before-write behavior, and evaluator nodes should be able to expose a named result variable with the same Label editing model as the existing variable nodes.

## What Changes

- Add a variable type selector to Extractor next to the Label field, initially supporting `string` and `array`.
- Persist Extractor variable type in node config and preserve it through domain import/export, clipboard, and backend export.
- Add a `Clear` checkbox to Setter that persists `clear: boolean`.
- Define `setVariable.config.clear: true` as clearing the target variable before evaluating and writing `valueExpression`.
- Add a Label field to Evaluator that works like Setter and Extractor Label fields: it edits config, validates JavaScript identifiers, does not rename the node title, participates in rename-aware expression refactoring, and becomes available to downstream expression fields.
- Keep existing workflows valid by defaulting new fields during config normalization.

## Capabilities

### New Capabilities
- `workflow-variable-config`: Covers variable-producing node metadata such as Extractor variable type and Setter clear-before-write behavior.

### Modified Capabilities
- `variable-label-input-unification`: Extend unified Label behavior to Evaluator.
- `workflow-evaluator-node`: Add evaluator result Label config and downstream variable behavior.
- `workflow-persistence-v2`: Preserve the new variable metadata and evaluator Label config across persistence and backend export.

## Impact

- Affected node definitions and config types: Extractor, Setter, Evaluator.
- Affected node UIs: Extractor variable type select, Setter clear checkbox, Evaluator Label input.
- Affected runtime/editor behavior: variable catalog collection, rename-aware expression refactoring, config normalization.
- Affected persistence paths: domain import/export, clipboard copy/paste, backend workflow export.
- No new external dependencies are expected.
