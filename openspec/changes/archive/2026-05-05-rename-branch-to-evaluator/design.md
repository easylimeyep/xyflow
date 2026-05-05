## Context

The workflow editor has a logic node currently represented as `branch`. Its implementation spans Node API v2 definitions, React node bindings, store helpers, edge routing, persistence mappers, app examples, and tests. The node already stores structured condition data as `conditions: BranchCondition[]` plus `logicalOperator`, and recent work added multiple-condition UI controls such as `Add Condition`.

The product direction is to make `evaluator` the canonical name. Backward compatibility is explicitly out of scope, so old `branch` node kinds and `branch-*` handles do not need aliases, migration, or import support.

## Goals / Non-Goals

**Goals:**

- Replace the `branch` node kind with `evaluator` across source, examples, specs, and tests.
- Replace `branch-true` and `branch-false` handle ids with `evaluator-true` and `evaluator-false`.
- Rename the visible node title from `Branch` to `Evaluator`.
- Preserve the evaluator config format, including the `conditions` array and `logicalOperator`.
- Gate multi-condition UI creation behind `runtime.enableEvaluatorMultipleConditions`, defaulting to `false`.
- When the flag is disabled, render only the first stored condition and hide `Add Condition`.

**Non-Goals:**

- No import aliases or migrations from `branch` to `evaluator`.
- No change to the condition array schema or logical-operator storage format.
- No redesign of expression inputs, condition operators, drag and drop, or validation semantics beyond the rename and feature flag.
- No change to node descriptions unless required by type or behavior consistency.

## Decisions

1. Use `evaluator` as the only supported node kind.

   Rationale: The user explicitly does not require backward compatibility, and a single canonical kind avoids long-term split terminology. The alternative was to support both `branch` and `evaluator` during a transition window, but that would require aliasing in mappers, graph helpers, tests, and public examples.

2. Rename handle ids together with the node kind.

   Rationale: Handles are part of the persisted graph edge contract. Keeping `branch-true` and `branch-false` would preserve old terminology in new graph data and create an awkward half-rename. The alternative was to leave handle ids stable to reduce implementation churn, but this conflicts with the requested full rename.

3. Keep config data shape stable while renaming TypeScript and runtime names.

   Rationale: `conditions` as an array is still the desired future format. Keeping the schema stable allows hidden multi-condition data to survive while the UI is temporarily constrained. The alternative was to collapse data to a single condition while disabled, but that would discard future-ready payloads and create another migration later.

4. Add `enableEvaluatorMultipleConditions` as a runtime feature flag with default `false`.

   Rationale: Runtime configuration is already the place where editor behavior such as operator catalogs is scoped per mounted editor instance. Defaulting to `false` makes the current product behavior conservative. The alternative was an environment-level feature flag, but this package is consumed as a component library and needs per-instance control.

5. Hide multi-condition affordances rather than disable them visually.

   Rationale: The request is to hide the `Add Condition` button for now. When disabled, only the first condition renders; additional stored conditions remain in config but are not editable until the flag is enabled. The alternative was to render all existing stored conditions without add controls, but the requested behavior is to show only the first.

## Risks / Trade-offs

- Persisted old graphs that contain `branch` will fail import or render as unsupported nodes. -> This is accepted as a breaking change and should be covered by updated validation and mapper tests.
- Search-and-replace can accidentally rename unrelated Git branch terminology or generic code branching language. -> Limit implementation edits to workflow node concepts, handle ids, public examples, and relevant specs/tests.
- Hidden additional conditions cannot be edited while the flag is disabled. -> Preserve the stored array unchanged and document this as feature-flag behavior.
- Existing tests and specs may still contain branch references in historical archives. -> Active source/spec references should be updated; archived change history can remain unless implementation checks require otherwise.
