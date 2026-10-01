# Proposal

## Why

The canvas search only lets the user walk matches one at a time. With dozens or hundreds of matches the counter `15 / 26` tells how many there are, not where they are. The user cannot see which nodes and fields are involved, and cannot jump straight to a specific occurrence. References dominate most result sets and bury labels and definitions. Substring matching also hits `max_rate` when the user wants `rate`. The original search change deferred the results list, source filters, and case and whole-word options to a second phase. This change delivers that phase as one results panel, which later debugging filters can extend.

## What Changes

- The `N / M` counter in the search bar becomes a toggle that expands a results panel attached below the bar. The panel is a disclosure, not a popover: it stays open while the user clicks the canvas, edits nodes, or picks a result. It collapses only through its toggle, or with the search itself. The expanded or collapsed state persists across reopening the search.
- The panel lists every match grouped by node, in canvas order:
  - a group header shows the node kind's icon, the node label, the kind title, and the group's match count;
  - each row shows the match's running number (the same `N` as the counter), a readable field name, and a text snippet with the matched text highlighted.
- Picking a row makes that match current and reveals its node, reusing existing navigation. `Enter` and `Shift+Enter` in the input keep working, and the panel's active row follows the current match.
- New matching options in the search input: **match case** and **whole word**. By default matching stays case-insensitive substring matching.
- New source filters in the panel: Labels, Variables, References. These are multi-select, all on by default, and each shows its count.
- One filtered set drives everything: the list, the counter, `Enter`/`Shift+Enter`, and the canvas marks. The panel explains a result set emptied by filters and offers a reset. The collapsed bar indicates when filters are active.
- Node definitions MAY describe their nested expression fields for display (for example, `conditions[<id>].left` shown as "Condition 2 · Left operand"). Fields without a description fall back to a generic label.
- Out of scope, deferred:
  - node category and "selection only" filters;
  - filters by runtime status (failed or skipped nodes);
  - a docked side panel;
  - previewing a match while arrowing through the list.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-canvas-search`:
  - matching gains match-case and whole-word options;
  - the counter becomes the toggle for a results panel;
  - new requirements cover the results panel, its rows, navigation from it, source filters, and the rule that filters define the match set everywhere.

  This delta builds on the `workflow-canvas-search-field-marks` change, which modifies the same matching requirement, so that change must be archived first.

## Impact

- `packages/flow/src/workflow/search/matches.ts`: matching options (case, whole word) in `buildSearchMatches`.
- `packages/flow/src/workflow/store/`:
  - the `search` slice gains `isResultsOpen`, the matching options, the source filter, and an action that sets the current match by key;
  - `selectSearchMatches` applies the options and filters;
  - options and filters survive `closeSearch`.
- `packages/flow/src/workflow/components/workflow-search/`: the counter becomes a toggle, option toggles are added to the input, and a new results panel component plus a row-description helper (snippet and field label) are added.
- `packages/flow/src/workflow/node-registry/define-node.ts`: an optional `describeExpressionField` hook, implemented for the evaluator kinds.
- `packages/ui`: a new `list-box` primitive (ListBox, sections, and virtualization on react-aria-components). No new external dependency; `react-aria-components` is already a dependency of `@flow/ui`.
- Styles: `workflow-search.styles.ts` gains the panel's slots.
- Tests: vitest (matching, selectors, slice, panel component), Playwright e2e `apps/web/e2e/workflow-canvas-search.spec.ts`, and the Storybook story `CanvasSearch.stories.tsx`.
