## Context

`ResultNode` already renders its category field with the shared native select components from `@workspace/ui/components/native-select`. `BranchNode` still uses the custom select popover components from `@workspace/ui/components/select` for both condition operators and the first editable logical combiner between conditions.

The branch node lives inside draggable canvas content and already uses `nodrag nopan` on its root. Native select controls reduce the amount of popover behavior embedded inside sortable node rows while preserving the existing branch config model.

## Goals / Non-Goals

**Goals:**

- Use `NativeSelect` and `NativeSelectOption` for all interactive branch node selects.
- Preserve the current branch condition config shape and update path.
- Preserve runtime branch operator labels, stored operator ids, missing-operator fallback options, and `requiresTarget`-driven target input visibility.
- Keep the non-interactive logical operator badges unchanged for repeated separators after the first editable combiner.
- Update branch node tests so they exercise native `change` events instead of custom select item clicks.

**Non-Goals:**

- Changing branch runtime semantics, condition evaluation, or exported workflow shape.
- Changing the result node implementation.
- Changing the shared native select component API.
- Redesigning sortable condition rows beyond the sizing classes needed for native selects.

## Decisions

1. Import native select components in `BranchNode` and remove the custom select imports.

   This matches `ResultNode` directly and keeps the branch implementation close to the established local pattern. The alternative was to wrap native select behind a branch-specific component, but the branch uses only simple option lists and does not need another abstraction.

2. Keep option values exactly as they are today.

   Condition operator options will continue using `operator.id` for the `<option value>` and `operator.value` for display text. The AND/OR control will continue storing lowercase `"and"` and `"or"` while displaying uppercase labels. This avoids runtime and persistence changes.

3. Preserve fallback options for unknown stored operators.

   The existing `activeOperators` logic will continue appending the current stored operator when it is absent from the active runtime catalog, so legacy branch conditions remain editable.

4. Test native select behavior through DOM select events.

   The current tests mock the custom select package and click synthetic select-item buttons. After the change, tests should mock or use the native select component as an actual `<select>` with `<option>` children and assert updates via `fireEvent.change`.

## Risks / Trade-offs

- Native select styling can differ from custom trigger styling across browsers -> keep sizing and text classes scoped in `branch-node.styles.ts` and compare against the compact result-node pattern.
- Native selects inside sortable rows may trigger drag/pan if event boundaries regress -> keep the branch root `nodrag nopan` class and verify interactive controls still update config in tests.
- Unknown operator fallback could accidentally lose display text if option rendering changes -> keep the fallback option generation unchanged and cover it in the existing branch node test.
