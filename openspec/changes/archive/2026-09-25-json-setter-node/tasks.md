## 1. Extract shared Setter pieces

- [x] 1.1 Create `nodes/data/setter-shared/config.ts` with `SETTER_ALLOWED_TARGETS`, `buildDefaultSetterConfig`, `setterVariable`, `validateSetterConfigValue`, and an `index.ts`; verify `pnpm typecheck` passes
- [x] 1.2 Create `setter-shared/setter-view.tsx` (`SetterView` with `kind`, `fallbackTitle`, `footer`), composing classes with `tv` styles only (no `cn`); verify typecheck passes
- [x] 1.3 Rebuild `set-variable/definition.ts` and `component.tsx` on the shared pieces; verify `set-variable/component.test.tsx` and `node-registry.test.ts` pass unchanged

## 2. JSON Setter node

- [x] 2.1 Add `JsonSetterNodeConfig` and register `jsonSetter` in the builtin config map in `workflow/types/types.ts`; verify typecheck passes
- [x] 2.2 Write failing tests first in `nodes/data/json-setter/component.test.tsx`: default config includes `appendInput: false`, the "Append input" checkbox dispatches `{ kind: "jsonSetter", key: "appendInput", value: true/false }`, and the Setter controls render; verify they fail
- [x] 2.3 Add `json-setter/definition.ts` (kind `jsonSetter`, title "JSON Setter", `appendInput` default + boolean validation, other keys delegated) plus `component.tsx` (`SetterView` + "Append input" checkbox footer) and `index.ts`; verify the tests from 2.2 pass
- [x] 2.4 Add definition tests: non-boolean `appendInput` is rejected, `setVariable` rejects `appendInput`, and `jsonSetter` declares its variable like the Setter; verify they pass

## 3. Registration and wiring

- [x] 3.1 Add `jsonSetter` to `builtin-definitions.ts`, `builtin-base-definitions.ts` and `src/nodes.tsx`; verify `BuiltinNodeKind` includes `"jsonSetter"` via typecheck
- [x] 3.2 Add `"jsonSetter"` to every built-in `allowedTargets` list containing `"setVariable"`, and add a registry test asserting that invariant; verify it passes
- [x] 3.3 Give `jsonSetter` the compact estimated height in `layout/elk-layout.ts`; verify `elk-layout.test.ts` passes
- [x] 3.4 Add a backend-export test: a `jsonSetter` with `appendInput: true` exports as a regular node with `config.appendInput === true` (strict and draft); verify it passes

## 4. Verification

- [x] 4.1 Add a `jsonSetter` node to the Storybook JSON nodes example; verify Storybook builds
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck` and `pnpm test` (with coverage for `packages/flow`) from the root and confirm all pass
- [x] 4.3 Run `openspec validate json-setter-node --strict` and confirm it passes
