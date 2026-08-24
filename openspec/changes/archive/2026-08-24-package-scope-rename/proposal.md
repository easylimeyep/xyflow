## Why

This repository is about to be consumed as a git submodule inside another pnpm monorepo. Both
monorepos publish their packages under the `@workspace/*` scope, and three names collide outright:
`@workspace/ui`, `@workspace/eslint-config`, `@workspace/typescript-config`. pnpm cannot resolve two
packages with the same name in one workspace, so the consumer's `pnpm install` fails before anything
else can be tried.

Merging the two UI packages instead of renaming is not viable. `@workspace/flow` and
`@workspace/expression-editor` import 17 modules from this repository's `@workspace/ui`; the consumer
lacks four of them (`action-bar`, `array-input-popover`, `sortable`, `hooks/use-event-callback`), and
this repository's `select` moved to `react-aria-components` in `b3d7538` while the consumer's is
built on `base-ui` — the component APIs differ. Renaming keeps both UI kits intact and independent.

## What Changes

- Rename the published package names to a dedicated `@flow/*` scope:
  - `@workspace/flow` → `@flow/flow`
  - `@workspace/ui` → `@flow/ui`
  - `@workspace/store` → `@flow/store`
  - `@workspace/expression-editor` → `@flow/expression-editor`
- Update every intra-repo import, `workspace:*` dependency entry, tsconfig path mapping, Tailwind
  content glob, and Vitest alias to the new names.
- Leave `@workspace/eslint-config` and `@workspace/typescript-config` renamed as `@flow/*` too, so no
  `@workspace/*` name survives in this repository.
- Keep every export path, directory layout, and public API identical — only names change.

## Capabilities

No capability behaviour changes. This is a rename with no functional delta, so no spec delta
accompanies it.

## Impact

- Affected code: all four package manifests, `apps/web`, `apps/storybook`, and every file importing
  across package boundaries.
- Affected behaviour: none. Same components, same exports, same paths.
- API/contract: package **names** are breaking for any existing consumer; import subpaths are not.
- Testing: the existing suites are the regression net — a missed import fails typecheck or build.

## Non-goals

- No dependency upgrades. Aligning React, lucide, and recharts versions with the consumer is a
  separate change so a version bump is never confused with a rename.
- No source or behaviour changes of any kind.
