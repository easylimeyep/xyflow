## Why

Evaluator result labels are optional, but the node UI currently treats the Label field like a required variable identifier and blocks clearing it. This conflicts with the existing data model, where missing evaluator labels normalize to an empty string and only explicit valid labels become downstream variables.

## What Changes

- Allow evaluator Label input commits with an empty or whitespace-only value, storing `config.label` as an empty string.
- Keep non-empty evaluator labels constrained to valid JavaScript identifiers.
- Preserve downstream variable discovery behavior: empty evaluator labels do not create variable options.
- Prevent evaluator label clearing from refactoring downstream expressions into blank variable references.
- Document the internal label/type data model across setter, evaluator, and extractor nodes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-evaluator-node`: evaluator result labels are optional in both persisted config and UI editing, and clearing the label must not synthesize defaults or corrupt downstream expressions.

## Impact

- Affected package: `packages/flow`.
- Affected areas: evaluator node component, shared variable identifier field behavior, node config rename hooks, expression variable discovery tests, evaluator component tests, and node config update tests.
- No backend DTO shape changes are expected; evaluator result label remains `config.label`, setter variable label remains `config.variableName`, extractor variable label remains `config.extractExpression`, and setter/extractor variable types remain `config.variableType`.
