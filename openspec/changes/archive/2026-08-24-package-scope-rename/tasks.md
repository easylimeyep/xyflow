## 1. Package Manifests

- [x] 1.1 Rename `name` in `packages/flow/package.json`, `packages/ui/package.json`, `packages/store/package.json`, and `packages/expression-editor/package.json` to the `@flow/*` scope.
- [x] 1.2 Rename `name` in `packages/eslint-config/package.json` and `packages/typescript-config/package.json` so no `@workspace/*` name remains in the repository.
- [x] 1.3 Update every `workspace:*` dependency entry across all package and app manifests to the new names.

## 2. Source Imports

- [x] 2.1 Rewrite cross-package imports in `packages/flow/src` to `@flow/ui`, `@flow/store`, and `@flow/expression-editor`.
- [x] 2.2 Rewrite cross-package imports in `packages/expression-editor/src` to `@flow/ui`.
- [x] 2.3 Rewrite cross-package imports in `apps/web` and `apps/storybook` to the new names.
- [x] 2.4 Grep the whole repository for the literal `@workspace/` and confirm zero remaining occurrences outside `openspec/changes/archive`.

## 3. Tooling Configuration

- [x] 3.1 Update tsconfig `paths` mappings in every package and app to the new names.
- [x] 3.2 Update Tailwind content globs that reference package paths by name.
- [x] 3.3 Update Vitest aliases and any test setup files referencing the old names.
- [x] 3.4 Update `eslint` and `prettier` config references to the renamed config packages.

## 4. Verification

- [x] 4.1 Delete `node_modules` and the lockfile entries for the renamed packages, run `pnpm install`, and confirm resolution succeeds.
- [x] 4.2 Run `pnpm typecheck` and confirm it is green — an unrewritten import fails here.
- [x] 4.3 Run `pnpm test` and confirm every package suite is green.
- [x] 4.4 Run `pnpm build` and confirm both apps build.
- [x] 4.5 Run `pnpm --filter web test:e2e:smoke` and confirm the editor still works end to end.
- [x] 4.6 Run `pnpm lint` and `pnpm format` and confirm both are clean.
