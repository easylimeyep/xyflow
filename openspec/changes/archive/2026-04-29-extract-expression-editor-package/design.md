## Context

`@workspace/flow` currently owns the complete expression editing stack: the React `ExpressionInput`, CodeMirror configuration, commit lifecycle, variable picker, template validation, autocomplete construction, and workflow-specific variable discovery. The reusable parts are already larger than a node-local widget, and they include hard-earned lifecycle fixes around `@uiw/react-codemirror` typing protection, blur commits, Enter commits, live validation, external value sync, and variable-picker selection.

The new package should separate expression authoring from workflow graph knowledge. Workflow code will continue to compute which variables are available for a node, while the reusable editor package will own how users author template expressions with those variables.

Target package boundary:

```text
@workspace/flow
  - knows nodes, edges, selected node, upstream reachability
  - computes ExpressionVariableOption[]
  - persists committed values into node config

@workspace/expression-editor
  - knows CodeMirror and React editor lifecycle
  - knows {{ expression }} parsing, validation, insertion
  - knows autocomplete and variable picker behavior
  - does not know workflow graph, React Flow, Zustand store, or node kinds
```

## Goals / Non-Goals

**Goals:**
- Create a reusable workspace package for the CodeMirror-backed expression editor.
- Preserve current workflow expression editing behavior during migration.
- Expose a commit-oriented public API that reflects the current blur/Enter/immediate-insert semantics.
- Export pure template and autocomplete utilities so tests and future consumers can use the expression logic without rendering React.
- Keep workflow variable collection in `@workspace/flow`.

**Non-Goals:**
- Change the `{{ expression }}` template language.
- Replace CodeMirror, `@uiw/react-codemirror`, `acorn`, Radix/shadcn-style UI primitives, or `cmdk`.
- Introduce a generic code editor package for arbitrary languages.
- Move workflow graph traversal or node config persistence into the reusable package.
- Change stored workflow document shape.

## Decisions

### Decision: Extract a domain-specific expression editor package

Create a package such as `@workspace/expression-editor` instead of a generic `@workspace/codemirror-editor`.

Rationale: the reusable value is not merely a CodeMirror wrapper. It is the combined template-expression behavior: validation, `{{ }}` trigger detection, variable insertion, autocomplete, popover interaction, and commit lifecycle. A generic CodeMirror package would either expose too many internals or fail to carry the behavior that consumers actually need.

Alternative considered: keep the component in `@workspace/flow` and export it from the flow package. This keeps implementation small, but it makes non-flow consumers depend on workflow/editor package concerns and leaves graph-specific types near the reusable UI.

### Decision: Use `ExpressionEditor` with `onCommit`

Expose the React component as `ExpressionEditor` with `value`, optional `placeholder`, `variables`, `onCommit`, and optional live/validation callbacks. Internally, flow may keep a compatibility alias or wrapper named `ExpressionInput` during migration, but new package API should use commit language.

Rationale: current `onChange` behavior is commit-based, not keystroke-based. Naming the callback `onCommit` makes consumer code honest and prevents accidental assumptions that external state updates on every typed character.

Alternative considered: keep `onChange` to reduce churn. This reduces initial diff size, but it preserves an inaccurate API name and makes reuse harder to reason about.

### Decision: Package exports both component and pure utilities

The package should export:
- `ExpressionEditor`
- `ExpressionVariableOption`
- commit/validation/completion types
- `parseTemplateSegments`
- `validateTemplateExpression`
- `buildExpressionInsertion`
- completion builders and CodeMirror completion source factory

Rationale: the React component is the main reuse target, while pure utilities let tests and non-React integration points validate or transform template expressions without rendering CodeMirror.

Alternative considered: export only the component. That simplifies public surface, but it forces tests and consumers to reach through flow internals or duplicate utility logic.

### Decision: Keep workflow variable catalog construction in flow

Do not move `collectWorkflowVariables` into the editor package. Flow will continue to build `ExpressionVariableOption[]` from workflow nodes and edges and pass it to the editor.

Rationale: variable discovery depends on workflow topology, node kinds, labels, and config interpretation. The reusable editor should accept a catalog, not discover it.

Alternative considered: move variable discovery into the package behind adapter callbacks. This would make the new package aware of graph concepts and increase the API surface before there is a second graph-like consumer.

### Decision: Preserve the single-buffer CodeMirror lifecycle

Keep CodeMirror as the editing buffer. Maintain a `liveValue` only for validation and trigger detection, and commit to external state on blur, Enter, or variable insertion.

Rationale: previous archived design identified this as the stable approach that avoids stale `value` reverts caused by `@uiw/react-codemirror` typing protection.

Alternative considered: restore a parent-owned draft buffer updated on every keystroke. That would reintroduce the class of race conditions this editor already fixed.

## Risks / Trade-offs

- Package extraction can accidentally change editor behavior. -> Migrate behind focused tests that cover blur commit, Enter commit, no per-keystroke commit, live validation, external value sync, autocomplete, and picker insertion.
- Moving dependencies can create duplicate or misplaced package dependencies. -> Declare CodeMirror, `@uiw/react-codemirror`, `acorn`, React, and UI dependencies at the new package boundary, then remove no-longer-needed direct dependencies from flow only after imports move.
- Styling may become split across packages. -> Move expression editor-specific styles with the editor package or export a package stylesheet, while keeping node layout styles in flow.
- A hard rename from `ExpressionInput` to `ExpressionEditor` can create noisy flow churn. -> Use a small flow-local wrapper or alias during migration if it keeps the implementation safer, then remove the old internal component once call sites are updated.
- The package may become too tied to `@workspace/ui`. -> Accept this for the first internal workspace extraction; split core and UI packages later only if an external or non-workspace consumer appears.

## Migration Plan

1. Create the new package scaffold and exports.
2. Move pure template, autocomplete, and expression editor types into the package.
3. Move the CodeMirror-backed React editor into the package and rename its public API to `ExpressionEditor`/`onCommit`.
4. Keep or add tests at the package boundary for pure utilities and React editor lifecycle.
5. Update flow imports and call sites to use the package while preserving existing node behavior.
6. Keep workflow-specific variable discovery and node config persistence in flow.
7. Run package tests, flow tests, typecheck, and lint.

Rollback strategy: if migration introduces behavioral regressions, keep the scaffolded package but point flow back to its current local `ExpressionInput` until tests identify the mismatch. Since stored workflow data does not change, rollback is code-only.

## Open Questions

- Should the package name be `@workspace/expression-editor` or a more specific name such as `@workspace/template-expression-editor`?
- Should expression editor styles be exported as a separate `./style.css` entry or bundled through existing global flow styles during the first migration?
