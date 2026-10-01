## Why

Canvas search marks whole nodes only. A node that matches twice — say its title "Calc price" and its variable `price` — lights up the same way for both. Stepping from one of those matches to the other changes the counter but nothing on screen moves, so the second press looks like it did nothing. Users also cannot tell whether a node matched by its title, its variable name or a reference inside an expression.

## What Changes

- The current match is marked on the **field** that holds it, and that mark moves with every step:
  - a title match marks the node title;
  - a variable-definition match marks the input holding the variable name (setter `variableName`, extractor `extractExpression`, evaluator result label);
  - a reference match marks the specific expression input: an inline token row, a setter value expression, an evaluator operand. A reference inside an array operand marks the operand's popover trigger.
- Every other matched field gets a subtle mark, so a node shows all its hits at a glance.
- The node-level mark stays for overview at low zoom, but for the node holding the current match it becomes a thin primary outline instead of the strong ring. The strong mark now belongs to the field. A current match with no field of its own keeps the strong mark on the node.
- A variable-definition match is reported only when the name is held in a field of its own. When a kind takes the name from the node title (the extractor's fallback, the path extractor), the title match already covers that text, so the duplicate definition match is dropped.
- Match identity inside evaluator conditions becomes stable: a reference is addressed by condition id and operand side (`conditions[<id>].left`, `conditions[<id>].right[1]`) instead of its position in the walk. Deleting or reordering an earlier condition no longer moves the current match. The refactor hook for structured config values gains an optional path argument for this; existing definitions keep working unchanged.
- Out of scope: highlighting the matched text inside the field (CodeMirror decorations), centring the viewport on the field rather than the node, and search options.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `workflow-canvas-search`: occurrence matching (no title-duplicate definition matches; stable identity for matches in structured values) and on-canvas marking (field-level marks, node mark demoted for the current node).

## Impact

- `packages/flow/src/workflow/search/matches.ts` — definition matches carry the field holding the name, or are dropped when that field is the title.
- `packages/flow/src/workflow/expression/refactor/expression-fields.ts`, `node-registry/define-node.ts` (`NodeConfigValueRefactor`), `nodes/logic/evaluator-shared/config.ts` — structured values report stable paths.
- `packages/flow/src/workflow/store/search-selectors.ts`, `store/store.ts` — a per-field status selector and hook.
- `packages/flow/src/workflow/nodes/node-shell` and its styles — title mark and the demoted current-node mark.
- Node views: inline expression (token rows), setter view, evaluator view (label input, condition operands, array operand trigger), extractor. `components/expression-input` gains a search-state mark.
- No new dependencies, no store history or persistence changes. The `NodeConfigValueRefactor` change is additive.
