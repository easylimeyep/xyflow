## Context

Evaluator nodes already model the result label as optional data: `config.label` defaults to an empty string, accepts any string at the schema layer, and only appears in downstream expression variables when it is a non-empty valid JavaScript identifier. The current mismatch is in the editor UI, where the evaluator Label input reuses the shared variable identifier hook with its default "cannot be empty" behavior.

Setter and extractor nodes use similar-looking Label controls, but they store different producer metadata:

| Node | Producer label storage | Type storage |
| --- | --- | --- |
| Setter | `config.variableName` | `config.variableType` |
| Extractor | `config.extractExpression` | `config.variableType` |
| Evaluator | `config.label` | none |

`node.data.label` remains the graph/display label for all node kinds and is persisted separately from producer labels.

## Goals / Non-Goals

**Goals:**

- Allow users to clear the evaluator Label input and commit an empty `config.label`.
- Continue validating non-empty evaluator labels as JavaScript identifiers.
- Preserve expression variable discovery: empty evaluator labels produce no variable option.
- Avoid accidental downstream expression rewrites when an evaluator label is cleared.
- Keep the internal storage shape unchanged across setter, extractor, and evaluator.

**Non-Goals:**

- Do not add `labelType` or `variableType` to evaluator nodes.
- Do not change backend/domain DTO shapes.
- Do not change setter or extractor label requiredness.
- Do not synthesize placeholder values like `conditionMatched` into stored evaluator config.

## Decisions

1. Add an explicit empty-value mode to the shared identifier field hook.

   `useVariableIdentifierField` should support an option such as `allowEmpty`. When enabled, a trimmed empty draft commits `""` without an error. Non-empty drafts still pass through `isValidJsIdentifier`.

   Alternative considered: create evaluator-only input logic. Rejected because the hook already owns the focus, blur, Enter, draft, and error lifecycle; making empty handling configurable keeps one lifecycle implementation.

2. Enable empty-value mode only for evaluator result labels.

   `EvaluatorNode` should pass the new option when wiring its Label field. Setter and extractor continue using the default required behavior because their labels are active producer identifiers.

   Alternative considered: make empty allowed by default and opt setter/extractor back into required mode. Rejected because it broadens the behavioral surface and risks weakening existing producer-label validation.

3. Treat clearing as a label removal, not as a rename to an empty identifier.

   Config rename hooks should refactor downstream plain variable references only when both the old and new names are non-empty valid identifiers. Changing `conditionMatched` to `""` should update evaluator config but leave existing expressions untouched so users can decide how to repair or remove those references.

   Alternative considered: remove downstream references automatically when clearing. Rejected because replacing `{{ conditionMatched }}` with a blank expression can silently corrupt templates.

4. Keep data normalization and DTO mapping unchanged.

   `config.label` remains the evaluator result label, `config.variableName` remains setter's producer label, `config.extractExpression` remains extractor's producer label, and `config.variableType` remains limited to setter/extractor.

   Alternative considered: introduce a normalized shared `label`/`labelType` contract across all variable-producing nodes. Rejected as a larger data model migration that is unnecessary for this fix.

## Risks / Trade-offs

- Existing expressions may reference a label after the evaluator label is cleared -> leave references unchanged and rely on existing validation/expression feedback rather than silently rewriting them.
- The shared hook could accidentally allow empty values in required fields -> default `allowEmpty` to `false` and cover setter/extractor behavior with existing tests.
- Users may confuse placeholder text with stored data -> keep placeholder-only guidance and verify empty evaluator config does not synthesize `conditionMatched`.

## Migration Plan

No persisted data migration is needed. Existing evaluator nodes with missing or empty `config.label` already normalize to `""`; the implementation only aligns UI commit behavior and rename-hook behavior with that model.
