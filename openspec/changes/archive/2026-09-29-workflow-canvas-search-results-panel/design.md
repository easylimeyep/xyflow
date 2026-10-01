# Design

## Context

For motivation, see proposal.md (Why). The current state that shapes the approach:

- **Matches.** `buildSearchMatches(nodes, registry, query)` in `search/matches.ts` returns `SearchMatch[]` in canvas order. Each match has a stable `key`, `nodeId`, `source`, an optional `fieldPath`, `occurrence`, `start`/`end` offsets into the searched text, and a `sortTuple`. It lower-cases both sides and uses `indexOf`, so the text itself is not kept on the match.
- **Selectors.** `store/search-selectors.ts` caches the match index per registry on `(nodes, query)`. Node and field marks, the counter, and next/prev all derive from `selectSearchMatches`. So whatever that selector returns is the match set everywhere. The current match is kept by `currentKey` and `currentSortTuple`, and `reconcileCurrentMatch` moves it to the nearest following match when it disappears.
- **Slice.** `closeSearch` resets `search` to `CLOSED_SEARCH`, which clears everything.
- **Reveal.** `WorkflowSearch` has an effect keyed on `currentKey` and `currentNodeId`. It calls `onRevealNode`, then `syncSearchCurrentMatch`. Any change of the current key therefore re-centres the canvas.
- **Field paths are technical:**
  - `key` for a string;
  - `key[i]` for an entry of a string array;
  - `conditions[<id>].left` / `.right` for evaluator operands (`evaluator-shared/config.ts`);
  - `key#n` otherwise.

  Only top-level keys have a human label (`NodeFieldSchema.label`).
- **Which fields a view renders** is known only inside each node view (`search-field-mark.tsx`, `renderedFieldsRef`). It is not available to code outside the node.
- **UI constraints:**
  - `packages/flow` has no direct `react-aria-components` dependency and uses `@flow/ui` primitives only;
  - styles are composed with `tv`, never `cn`;
  - `@flow/ui` has `Popover`, `ToggleGroup` (a react-aria `ToggleButtonGroup`), and `Command` (`Autocomplete` + `Menu`), but no ListBox primitive;
  - `react-aria-components@1.19` exports `ListBox`, `ListBoxSection`, `Header`, `Virtualizer` and `ListLayout`.

## Goals / Non-Goals

**Goals:**
- One match set, produced by one selector, drives the panel, the counter, navigation, and canvas marks.
- The panel adds no new navigation path: a pick sets the current key, and the existing reveal effect does the rest.
- Rows stay cheap: nothing is added to `SearchMatch`, and row text is derived only for rows that are rendered.
- The panel's structure can later accept more filter facets (node category, selection, runtime status) without being restructured.

**Non-Goals:**
- Marking rows whose field is not rendered on the node (hidden or shown as a badge). The views own that knowledge and publish it only per node. Surfacing it would need a store-level registry of rendered fields, which is not worth it for a hint.
- Runtime-status filters, and bridging the runtime overlay into the store.
- A docked side panel, resizing the panel, or collapsing individual groups.
- Previewing a match while arrowing through the list.

## Decisions

### 1. Filters live in the store and are applied inside `selectSearchMatches`

`WorkflowSearchState` gains:
- `isResultsOpen: boolean`;
- `options: { matchCase: boolean; wholeWord: boolean }`;
- `sources: ReadonlySet<SearchMatchSource>`, or an equivalent record of booleans.

The match index cache key extends from `(nodes, query)` to `(nodes, query, options)`: options change matching, so they rebuild the index. Source filtering is a cheap pass over the cached full list. It is cached separately, keyed by the full list and the `sources` value, so a filter toggle does not rescan the graph. It also yields per-source counts for the chips. `matchedNodeIds` and `fieldKeysByNode` are built from the filtered list, which makes marks follow filters with no change to node or field code.

*Alternative:* filtering in the component. Rejected: next/prev, the counter, and marks would then disagree with the list, which is exactly what the "only match set" requirement forbids.

### 2. `closeSearch` keeps preferences, clears the session

`closeSearch` resets `isOpen`, `query`, `currentKey`, and `currentSortTuple`. It keeps `isResultsOpen`, `options`, and `sources`. The `CLOSED_SEARCH` constant becomes a function of the previous state. Its identity shortcut (`state.search === CLOSED_SEARCH`) becomes "already closed and empty → return state", so a redundant close still does not notify subscribers.

### 3. Matching options in `buildSearchMatches`

`buildSearchMatches(nodes, registry, query, options?)` works as follows:
- **Case.** With `matchCase`, neither side is lower-cased.
- **Whole word.** Each candidate offset is checked for identifier characters (`/[\p{L}\p{N}_$]/u`) at `start - 1` and `end`. A rejected candidate does not consume text: the scan resumes at `cursor + 1`, so `ratex rate` still finds the second `rate`.

`findOccurrences` and `findReferenceOccurrences` take the options. The keys are unchanged, so the current match survives toggling an option whenever it still matches.

### 4. Setting the current match by key

A new slice action `setSearchCurrentMatch(key)` looks the key up in `selectSearchMatches`. If found, it stores `currentKey` and `currentSortTuple`. If not, it does nothing. The existing reveal effect then centres the node. No selection or history change is involved, so this matches next/prev by construction.

### 5. A `ListBox` primitive in `@flow/ui`

`packages/ui/src/components/list-box.tsx` wraps the react-aria-components pieces with default styling:
- `ListBox`;
- `ListBoxItem`;
- `ListBoxSection`;
- `ListBoxHeader`;
- a re-export of `Virtualizer` and `ListLayout`.

`@flow/ui` may use `cn` internally, as its other components do. `packages/flow` consumes the primitive and styles its own slots with `tv`. `ListBox` accepts a `ref`, which the bar uses to move focus into the list.

*Alternatives considered:*
- `@flow/ui` `Command`. It brings a second search input and `role="menu"` semantics, which suit actions, not results.
- A plain `div` list with hand-written roving focus. That reimplements what ListBox provides: typeahead, section semantics, and virtualized focus.

### 6. Panel structure and virtualization

The panel is a sibling block inside the search root. It is not a `Popover`:
- the root becomes a vertical stack of the bar row and the panel;
- the counter becomes a `Button` with `aria-expanded` and `aria-controls` pointing at the panel.

The `aria-live="polite"` region moves off the button into a visually hidden sibling that carries the same text. Announcements keep working without the button's label changing under focus.

The list uses a sectioned collection, one section per node, and renders through `Virtualizer` + `ListLayout` from the start. Rows and headers are single-line with fixed sizes (`SEARCH_RESULT_ROW_SIZE`, `SEARCH_RESULT_HEADING_SIZE`), so the layout needs no measuring. The panel holds its own `ListLayout` instance: `getLayoutInfo(currentKey)` gives the current row's rect, so the list is scrolled to it without taking focus, which react-aria's own scroll-into-view requires. The panel's maximum height is about half of the canvas height (a container-query unit, since the bar already sits in a `@container`), with a floor for small canvases.

- **Active row.** The ListBox is single-select with `selectedKeys = [currentKey]`. Picking an item calls `setSearchCurrentMatch`. A `useEffect` on `currentKey` scrolls the row into view using the layout rect.
- **Focus.** Focus movement stays inside the ListBox. `onAction` / `onSelectionChange` fire only on `Enter` or a click, never on focus, which satisfies "focus does not navigate".
- **Keys.**
  - `ArrowDown` in the input, when the panel is expanded, focuses the current row (found by `data-key`), or the list itself when that row is not rendered.
  - `Escape` inside the ListBox is intercepted, and focus returns to the input. Propagation stops so the canvas and search Escape handlers do not run.

### 7. Row description: `describeSearchMatch`

A pure helper, `search/describe-match.ts`, takes `(registry, node, match)` and returns `{ fieldName, snippet: { before, hit, after, clippedStart, clippedEnd } }`.

`fieldName`:
- label match → "Label";
- definition match → the schema label of `fieldPath`, or the key humanized (`variableName` → "Variable name") when the schema has no field for it, which is common for keys a custom view renders;
- reference match:
  - `key` → the schema label, or the humanized key;
  - `key[i]` → that label + ` #${i + 1}`;
  - anything else → `definition.describeExpressionField?.(fieldPath, node.data.config)`, otherwise "Expression".

Snippet text:
- label match → `node.data.label`;
- definition match → the held name;
- reference match → the template, which is re-read with the same path walk (`forEachExpressionField`) that produced the match. The helper indexes the node's fields by `fieldPath` once per node.

The window is ±24 characters around `[start, end)`, and newlines are collapsed to spaces.

Rows call the helper while rendering. With virtualization, only visible rows pay. Results are memoized per `(node reference, match key)`.

`describeExpressionField` is a new optional member of the node definition in `define-node.ts`. The evaluator kinds implement it by resolving `conditions[<id>]` to the condition's one-based position and mapping `left` / `right` to "Left operand" / "Right operand".

### 8. Filter and option controls

- **Options** (`Aa`, `ab`) are `Toggle` buttons inside the input row, before the counter, with `aria-pressed` and tooltips.
- **Sources** are a `ToggleGroup` with `selectionMode="multiple"` at the top of the panel. Each item shows its source's count. A source with zero matches is dimmed but stays enabled, so the layout does not shift.
- **Filter indicator.** While any source is disabled, the counter carries a dot indicator, and its accessible name gains "filtered".
- **Filters empty the set.** When the query has matches but the filtered set is empty, the counter shows "No results", and the panel body shows "N matches hidden by filters" with a Reset button that enables every source.

## Risks / Trade-offs

- **[Risk] Delta conflict with `workflow-canvas-search-field-marks`.** That change modifies the same matching requirement and is still unarchived. → Archive it before this change. The MODIFIED block here was written against its version of the requirement.
- **[Risk] Virtualizer in jsdom.** Virtualized collections render nothing without layout, so component tests may see no rows. → Tests stub `clientWidth` / `clientHeight` on `HTMLElement.prototype`, the pattern react-aria uses in its own tests. Scrolling, which jsdom cannot show, is covered by Playwright e2e.
- **[Trade-off] Current match after resetting filters.** Filtering out the current match moves it to the next one, and the reveal effect stores that key. Resetting the filters keeps the user on it instead of jumping back.
- **[Risk] Scroll-into-view fighting user scroll.** Scrolling to the current row on every graph edit would yank a user who is reading the list. → Scroll only when `currentKey` changes, not on list recompute.
- **[Trade-off] Hidden-field marker dropped.** See Non-Goals. Rows for hidden fields look like any other row, and the list is still the only place such matches are visible at a glance.
- **[Trade-off] Preferences persist only per editor mount.** They live in the store, not in `localStorage`. They reset on reload, which matches the other search state.
- **[Risk] Whole-word boundaries in labels.** Labels are prose, not identifiers, so whole word treats `-` and spaces as boundaries and letters of any script as word characters. → The boundary test is Unicode-aware (`\p{L}\p{N}`), so a Cyrillic label behaves like a Latin one.

## Migration Plan

This change is additive. Consumers of `WorkflowEditor.Search` get the panel through the existing component. There are no prop changes and no stored data.
