## Context

Evaluator, Setter, and Extractor label controls share a variable identifier editing model through node config and `renameConfigKey`. Setter stores its variable identifier in `config.variableName`; Evaluator stores its result identifier in `config.label`. Those config values drive downstream variable discovery and expression refactoring, so defaulting them to example identifiers creates real workflow state, not just UI guidance.

Keyword token rows are expression-capable inputs, but the field represents tokens. A literal placeholder communicates the common case more directly than an expression example.

## Goals / Non-Goals

**Goals:**

- Store empty defaults for new or normalized Evaluator result labels.
- Store empty defaults for new or normalized Setter variable labels.
- Preserve inline placeholder guidance in label fields without committing placeholder text to config.
- Prevent empty Evaluator labels from becoming downstream variable options.
- Replace Keyword token placeholder guidance with `token`.
- Keep JavaScript identifier validation for non-empty labels.

**Non-Goals:**

- Remove the Evaluator Label or Setter Label controls.
- Change node titles such as `Evaluator` or `Setter`.
- Change condition evaluation, branch handles, or keyword token persistence semantics.
- Add uniqueness validation for variable labels.
- Change Extractor defaults unless a separate request asks for it.

## Decisions

### Empty config value is the source of truth

Evaluator `buildDefaultConfig().label` and Setter `buildDefaultConfig().variableName` should return empty strings. Import/config normalization should therefore fill missing keys with empty strings instead of example identifiers.

Rationale: this keeps new nodes honest: until the author names a variable-producing field, no variable name exists.

### Placeholders remain UI-only guidance

Evaluator and Setter label inputs should display placeholders but should not derive their controlled value from placeholder text. Existing hooks can continue to validate and commit user-entered values, but component-level fallback such as `asText(config.label).trim() || "conditionMatched"` should be removed for Evaluator.

Rationale: placeholder text helps the author, but it must not affect stored config, downstream discovery, or export behavior.

### Empty labels are not variable producers

Variable collection should continue to require a valid JavaScript identifier before exposing a variable. An empty Evaluator label should be ignored naturally by the same validity gate used for invalid labels.

Rationale: empty default labels should not create empty variable options or trigger expression refactors.

### Keyword placeholder uses a literal token example

Keyword field metadata and row `ExpressionInput` placeholders should use `token`.

Rationale: the control accepts literal tokens and expression tokens, and the most neutral default hint is a literal token.

## Risks / Trade-offs

- Tests and fixtures may depend on old defaults for copy/paste, backend export, and variable discovery. Update them intentionally so failures reflect real contract changes rather than broad snapshots.
- Workflows imported without label fields will now normalize to empty labels. Existing workflows that already store `conditionMatched` or `myVar` should preserve those explicit values.
- Rename-aware expression refactoring should not run for empty old/new labels. Existing identifier validation should cover this, but focused tests should verify no empty-name variable is exposed.

## Migration Plan

1. Update node definition defaults for Evaluator and Setter.
2. Remove component fallbacks that turn empty Evaluator labels into `conditionMatched`.
3. Keep or add label placeholders in the UI.
4. Replace Keyword token placeholders with `token`.
5. Update tests and fixtures for empty defaults and preserved explicit legacy values.
6. Run focused workflow node, registry, mapper, and variable discovery tests.
