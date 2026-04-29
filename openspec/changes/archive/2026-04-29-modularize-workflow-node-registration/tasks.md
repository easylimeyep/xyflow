## 1. Registry Boundary

- [x] 1.1 Add an explicit client-side node component registry that maps `NodeKind` values to React Flow node components.
- [x] 1.2 Update `buildNodeTypes` to combine pure node definitions with the client component registry without importing side-effect binding modules.
- [x] 1.3 Remove `component-bindings.ts` after all custom node components are covered by the explicit view registry.

## 2. Node Feature Modules

- [x] 2.1 Move the branch node into `nodes/logic/branch/` with separate `definition.ts`, `component.tsx`, and `index.ts` entrypoints.
- [x] 2.2 Move result node files into `nodes/logic/result/` with the same feature-folder convention.
- [x] 2.3 Move set variable node files into `nodes/data/set-variable/` with the same feature-folder convention.
- [x] 2.4 Move inline expression node files into `nodes/data/inline-expression/` with the same feature-folder convention.
- [x] 2.5 Move extractor node files into `nodes/data/extractor/` with the same feature-folder convention.
- [x] 2.6 Update imports across workflow code and tests to use the new node module entrypoints.

## 3. Contract Tests

- [x] 3.1 Update pure registry smoke tests to verify all definitions are present without relying on client component bindings.
- [x] 3.2 Add or update view registry tests to verify every component binding references a valid `NodeKind`.
- [x] 3.3 Add or update `buildNodeTypes` coverage for explicit custom component resolution and deterministic default renderer fallback.
- [x] 3.4 Confirm non-UI workflow tests can import `nodeRegistry` without importing the client view registry.

## 4. Verification

- [x] 4.1 Run focused workflow node registry and node rendering tests.
- [x] 4.2 Run workflow-related typecheck or the repository's equivalent validation command.
- [x] 4.3 Review the final diff to ensure no workflow behavior, node kind names, persisted config shapes, or runtime DTO contracts changed.
