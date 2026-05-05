## Why

The workflow logic node currently named `branch` is being repurposed as an evaluator, and the codebase should use that terminology consistently before more condition-editing behavior is added. This change intentionally drops backward compatibility for old `branch` identifiers so the node model, handles, UI title, and tests converge on one canonical name.

## What Changes

- **BREAKING** Rename the `branch` node kind to `evaluator` across node definitions, registries, graph examples, persistence expectations, tests, and developer-facing references.
- **BREAKING** Rename branch output handle ids from `branch-true` / `branch-false` to `evaluator-true` / `evaluator-false`.
- Change only the node title from `Branch` to `Evaluator`; other descriptions can remain unchanged unless they reference the old kind or handle ids.
- Add a runtime feature flag named `enableEvaluatorMultipleConditions`, defaulting to `false`.
- When `enableEvaluatorMultipleConditions` is `false`, hide the `Add Condition` button and render only the first stored condition while preserving the existing `conditions` array format.
- Keep the evaluator config shape unchanged, including `conditions: []` and `logicalOperator`, so multi-condition data can be retained for future enablement.

## Capabilities

### New Capabilities

- `workflow-evaluator-node`: Defines the evaluator node as the canonical logic node that replaces branch terminology and handle ids.

### Modified Capabilities

- `workflow-node-api-v2`: Node API v2 must expose `evaluator` as the canonical node kind and reject/omit `branch`.
- `workflow-persistence-v2`: Domain and clipboard codecs must roundtrip evaluator semantics and treat `branch` as unsupported.
- `workflow-editor-compound-api`: Runtime configuration must expose the evaluator multi-condition feature flag and evaluator operator overrides.
- `workflow-branch-operator-options`: The boolean-condition UI must use evaluator naming and gate multi-condition controls behind `enableEvaluatorMultipleConditions`.

## Impact

- Affected packages: `packages/flow` node definitions, node view bindings, store helpers, edge routing/layout helpers, validation, mappers, tests, and public exports/types.
- Affected app examples: `apps/web/app/components/workflow-examples/*` graphs and handle ids.
- Affected specs/docs/tests that currently reference `branch`, `BranchNode`, branch config types, or `branch-*` handles.
- No data migration or backward-compatible import alias is required for old `branch` payloads.
