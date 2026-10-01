## Why

The JSON vocabulary (`pathExtractor`, `jsonEvaluator`) has no node that writes a variable, so a JSON
flow borrows the plain Setter. The backend needs to know, per setter, whether the node's input
payload is appended to the value it writes. The plain Setter's contract is what its backend already
executes, so the flag goes on a new JSON Setter node and the plain Setter stays as it is.

## What Changes

- New built-in node kind `jsonSetter` ("JSON Setter", category `data`). It has the same config as
  the Setter (`variableName`, `variableType`, `valueExpression`, `clear`), the same variable
  declaration and rename behaviour, and the same connection rules.
- `jsonSetter` adds a boolean config flag `appendInput`, default `false`, edited with an
  "Append input" checkbox next to "Clear". The editor only stores and exports the flag. What it
  means at runtime is up to the backend.
- `jsonSetter` is exported from `@flow/flow/nodes` and included in `builtinDefinitions` /
  `builtinBaseDefinitions`. Every built-in node that can target `setVariable` can also target
  `jsonSetter`.
- Backend export (strict and draft) sends `jsonSetter` as a regular node, with `appendInput` in its
  `config`. No new DTO shape is needed.
- The plain Setter (`setVariable`) does not change.

## Capabilities

### New Capabilities

- `workflow-json-setter-node`: the JSON Setter node covers its Setter-equivalent config and variable
  declaration, the `appendInput` flag (default, validation, UI toggle, persistence/export), and
  where it is registered.

### Modified Capabilities

_None._ The Setter requirements in `workflow-variable-config` apply to `setVariable` and are not
changed.

## Impact

- `packages/flow`: new `workflow/nodes/data/json-setter/` (definition, component, index),
  `JsonSetterNodeConfig` in `workflow/types/types.ts`, registry lists
  (`builtin-definitions.ts`, `builtin-base-definitions.ts`, `nodes.tsx`), `allowedTargets` of
  existing built-ins, ELK estimated height, node styles.
- Public API of `@flow/flow`: new `jsonSetter` definition and `BuiltinNodeKind` member. This is
  additive only.
- Backend: must accept nodes with `kind: "jsonSetter"` and read `config.appendInput`.
- Storybook JSON nodes example may show the new node.
