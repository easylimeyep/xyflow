## Context

`setVariable` has its definition in `nodes/data/set-variable/definition.ts` and its view in
`component.tsx`. The view hard-codes `kind: "setVariable"` in every `updateNodeConfig` call and falls
back to the title "Setter". The JSON Evaluator solved the same "sibling node" problem already:
`nodes/logic/evaluator-shared/` holds a view parameterized by `kind`, `fallbackTitle` and a `footer`
slot, plus shared config builders. Each concrete node is a thin definition plus a small component.
The backend export sends every non-evaluator node through `mapRegularNode`, which copies `config`
as is.

## Goals / Non-Goals

**Goals:**
- `jsonSetter` reuses Setter logic instead of copying it, and `setVariable` keeps its behaviour
  and public shape.
- `appendInput` flows through the existing generic paths (normalization, history, clipboard,
  export) with no special cases.

**Non-Goals:**
- Any runtime meaning for `appendInput` in the editor, such as preview or expression evaluation.
- Changes to `setVariable` config or UI.
- New backend DTO types.

## Decisions

1. **Extract `nodes/data/setter-shared/`** (mirrors `evaluator-shared`):
   - `config.ts`: `SETTER_ALLOWED_TARGETS`, `buildDefaultSetterConfig()`,
     `setterVariable(node)` (the current `variable` callback), `validateSetterConfigValue(key, value)`
     (returns `false` for unknown keys, so the caller decides which extra keys it accepts).
   - `setter-view.tsx`: `SetterView` with props `nodeId`, `data`, `selected`,
     `kind: "setVariable" | "jsonSetter"`, `fallbackTitle`, `footer?: ReactNode`. It renders the
     Label/Type row, Value expression and Clear, and puts `footer` inside the same `FieldGroup`.
   - `setVariable` is rebuilt on these pieces. Its public definition and rendered output stay the
     same, and its existing tests are the regression guard.
   - *Alternative*: copy `set-variable/` into `json-setter/`. Rejected because the two nodes would
     drift apart, which is the reason `evaluator-shared` exists.
   - *Alternative*: add `appendInput` to `setVariable` behind a definition flag. Rejected because
     the user wants a separate node, and it would change the Setter's config schema.
2. **`jsonSetter` definition**: `defineNode({ kind: "jsonSetter", title: "JSON Setter", category:
   "data", icon: FileJson (lucide), ... })`, spreading the shared builders. `buildDefaultConfig`
   adds `appendInput: false`. `validateConfigValue` handles `appendInput` as a boolean and passes
   every other key to `validateSetterConfigValue`. Same `extraExpressionConfigKeys` and
   `renameConfigKey` as Setter.
3. **Allowed targets**: add `"jsonSetter"` to every built-in `allowedTargets` list that contains
   `"setVariable"` (`EVALUATOR_ALLOWED_TARGETS`, extractor, path-extractor, inline-expression,
   setter-shared). This follows the existing convention of listing kinds explicitly.
4. **Types**: `JsonSetterNodeConfig = SetVariableNodeConfig & { appendInput: boolean }`, registered
   in the builtin config map in `types.ts` next to `setVariable`.
5. **Layout/styles**: in `elk-layout.ts`, `jsonSetter` uses the same compact height as
   `setVariable`. The view reuses `setVariableNodeStyles`, so no new styles module is needed.
6. **Export**: nothing to change, because `mapRegularNode` already copies `config`. Tests pin the
   behaviour.

## Risks / Trade-offs

- [Refactoring `setVariable` onto the shared view could change its DOM or behaviour] → keep the
  existing `set-variable/component.test.tsx` unchanged and green. Add JSON Setter tests next to it.
- [Hand-kept `allowedTargets` lists can miss a kind] → add a registry test asserting that every
  built-in that targets `setVariable` also targets `jsonSetter`.
- [Backend does not yet know `jsonSetter`] → additive kind. Hosts that do not want it can leave it
  out of `definitions`.
