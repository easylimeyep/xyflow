# Design

## Context

See proposal.md for the motivation. These parts of the current code shape the approach:

- **Matches.** `buildSearchMatches` (`search/matches.ts`) emits `SearchMatch { key, nodeId, source, fieldPath?, occurrence, start, end, sortTuple }`:
  - references carry `fieldPath` from the shared walk `mapExpressionFields` (`expression/refactor/expression-fields.ts`): `key`, `key[i]`, or `key#n` for templates reached through a kind's `refactorConfigValue`;
  - labels and definitions carry no `fieldPath`.
- **Structured values.** `refactorEvaluatorConfigValue` (`nodes/logic/evaluator-shared/config.ts`) hands each operand template to `rewrite(template)` with no location. `key#n` is therefore a running count, so deleting condition 1 shifts every later match's key.
- **Variable names.**
  - The name comes from the kind's `variable()` reader. That reader reports a name, not where the name came from.
  - Setter, JSON setter and both evaluators hold it in the config key named by `renameConfigKey` (`variableName`, `label`).
  - The extractor holds it in `extractExpression` but falls back to the node label.
  - The path extractor always uses the node label.
- **Marks.**
  - `selectNodeSearchStatus` returns `none | match | current` per node, from a per-registry cache (`store/search-selectors.ts`).
  - Renderers pass it to `NodeShell` as `searchState`. `DefaultNodeRenderer` receives it from `buildNodeTypes` and stays store-free.
- **Where fields render.**
  - `NodeShell` renders the title.
  - Plain `Input`s hold variable names: the setter view's "Label", the evaluator view's "Label", the extractor's "Label".
  - `ExpressionInput` (`components/expression-input`) wraps the CodeMirror editor. It is used by:
    - the setter `valueExpression`;
    - `OperandExpressionInput` for value operands;
    - array-operand rows inside `ArrayInputPopover`, reached through the operand's trigger.
  - Inline-node token rows render in `KeywordExpressionListInput`, one per `template[i]`.
- **Hidden conditions.** With `enableEvaluatorMultipleConditions` off, the evaluator view shows only the first condition. Later conditions still exist in config and in the walk.

## Goals / Non-Goals

**Goals:**
- One status source per field. It must be cheap enough to call from every expression input on a 180-node canvas without breaking `workflow-performance-budget-v2`.
- Field identity that survives edits to sibling entries.
- No new required API for host-defined kinds. A host kind without the new hooks keeps working and keeps its node-level mark.

**Non-Goals:**
- Text-range highlighting inside CodeMirror.
- Scrolling or centring the viewport on the field.
- Marks on fields that are not rendered at all. Hidden evaluator conditions fall back to the node mark.

## Decisions

### 1. Stable paths for structured values: an optional path argument on the rewrite callback

Extend `NodeConfigValueRefactor`'s `rewrite` to `(template: string, path?: string) => string`.

- `refactorEvaluatorConfigValue` passes `conditions[<id>].left`, `conditions[<id>].right`, and, for array operands, `...left[<i>]` / `...right[<i>]`.
- `mapExpressionFields` uses the supplied path. It falls back to today's `key#n` when a host refactor passes none.
- Rename ignores the argument, so rename behaviour is unchanged.

*Alternative:* a separate read-only "list templates with paths" hook on the definition. Rejected: it would be a second walk per kind that can drift from the rewrite, the very problem the shared traversal exists to prevent.

### 2. Definition matches are anchored to the config key that holds the name

A definition match gets `fieldPath = renameConfigKey` when `config[renameConfigKey]`, trimmed, equals the name returned by `variable()`.

- **Name equals the trimmed node label, and no key holds it:** the name came from the title (extractor fallback, path extractor), so the definition match is dropped as a duplicate of the label match.
- **Neither holds:** a host kind whose name lives somewhere we cannot locate. The match is kept without a `fieldPath`; per the spec it is marked on the node.

This needs no new definition API: every built-in kind that holds a name in its own field already declares that field as `renameConfigKey`.

*Alternative:* add `variableField` to `NodeDefinition`. Rejected for now: redundant with `renameConfigKey` for every built-in kind. It can be added later if a host kind needs it.

### 3. A per-field status selector, keyed as `nodeId + fieldPath`

The match-index cache gains a nested map from `nodeId` to `fieldKey` to `true`. Keys:
- `"label"` for label matches;
- the definition's `fieldPath`;
- the reference's `fieldPath`.

`selectFieldSearchStatus(state, nodeId, fieldKey)` returns `none | match | current`; `current` means the current match's `nodeId` and field key are equal to these. Exposed as `useFieldSearchStatus(nodeId, fieldKey)`. A string result means only fields whose status flips re-render.

Array operand rows roll up to their trigger: the trigger asks for `conditions[<id>].left` with `{ includeChildren: true }`, which also matches `conditions[<id>].left[<i>]`.

The node status gains no new value. `NodeShell` receives `searchState` and `hasCurrentSearchField`. It picks the strong node ring only when `searchState === "current" && !hasCurrentSearchField`, and the thin primary outline otherwise.

**"Has a field" means a field the view actually rendered.** Each mark registers its field key with its node view on mount, through a per-view registry. `hasCurrentSearchField` is true only when the current field is registered, or is the title, which every node draws. So:
- a host kind drawn by `DefaultNodeRenderer` registers nothing beyond the title and keeps the strong node mark for any other match;
- a condition hidden while multiple conditions are off never registers;
- an operand `ConditionRow` swaps for the upstream badge, or a right operand the operator does not use, never registers.

A view states nothing it does not draw, so no predicate has to duplicate its rendering rules.

*Alternative:* pass the whole list of the node's matches to the view. Rejected: one array per node re-renders the node on every step.

### 4. Marks live on wrappers that subscribe per field, styled with `tv`

A shared `searchFieldStyles` `tv` definition draws both marks: match gives a subtle amber ring and tint, current gives a strong primary ring.

- **Each marked field subscribes on its own.** A small store-bound wrapper sits around the field and calls `useFieldSearchStatus`:
  - `SearchFieldMark` wraps plain `Input`s: the setter and extractor variable names, the evaluator label;
  - `SearchMarkedExpressionInput` wraps `ExpressionInput`: the setter value expression and inline token rows (`template[i]`).

  When the mark moves, only the two wrappers whose status flipped re-render. The field inside is the same element and is left alone.
- **Evaluator operands.** `ConditionRow` subscribes for its own two operands, using `includeChildren` so array entries roll up. It passes the state to `OperandEditor` as a prop. `OperandEditor` stays store-free because its integration test renders it alone. An array operand is marked on the wrapper around its popover trigger.
- **The title.** Views pass `SearchMarkedTitle` as `NodeShell`'s `title`; it subscribes on its own like the other field marks. `NodeShell` stays store-free, and the node view subscribes only to `searchState` and `hasCurrentSearchField` (`useNodeSearchMarks`). Neither changes when the mark moves between a title and a field of the same node, so that step re-renders the two marks and not the view.
- **`ExpressionInput` itself.** It keeps an optional `searchState` prop and is always wrapped, so a mark appearing never remounts the editor.

*Alternative considered:* views compute every field's status and pass it down, keeping all leaves store-free. Rejected: a mark moving between two fields of a node would re-render the whole node view, contrary to the field-level re-render requirement.

*Consequence:* node-view unit tests that mock `useNodeStoreData` now render inside a `WorkflowStoreProvider`. The wrappers read the real (empty) store and show no mark there.

### 5. Render cost

- Each marked control adds one store subscription. A store change runs these selectors, and each one is O(1) on a cache hit, the same pattern as the node selector.
- `store.performance.test.ts` is re-run to confirm the budget.
- With search closed, every field selector returns `"none"` immediately.

## Risks / Trade-offs

- **[Risk]** A host `refactorConfigValue` that passes no path keeps positional `key#n` identity. → Documented on the type. Only its marks and identity are weaker; nothing breaks.
- **[Risk]** Hidden evaluator conditions and badge-replaced operands have no rendered field. → They never register, so the node keeps the strong mark (Decision 3).
- **[Risk]** Condition paths use the condition id, so two conditions sharing an id (hand-edited data) would share a match key. → A repeated id falls back to the positional path.
- **[Risk]** Dropping the label-derived definition match lowers counts for extractor and path-extractor nodes. → Intended by the spec change. Tests and the Storybook count are updated.
- **[Trade-off]** The current node is now marked with a thin outline. At very low zoom it is less prominent than today's strong ring. → Still distinct by colour (primary vs amber), and the viewport centres on it.
