## Context

Extractor and Setter already act as variable-producing nodes. Their visible `Label` controls edit config-level identifiers (`extractExpression` and `variableName`) instead of mutating `node.data.label`, and those config keys drive downstream expression variables and rename-aware refactoring. Evaluator currently has condition config and branch outputs, but no editable config-level result label and no downstream variable entry.

Node config persistence is schema-driven through node definitions: default config keys define allowed persisted keys, validation gates updates/imports, and domain/backend export preserve normalized config. This makes node config the right place for Extractor variable type, Setter clear-before-write, and Evaluator result label.

## Goals / Non-Goals

**Goals:**
- Add Extractor `variableType` metadata with supported values `string` and `array`.
- Add Setter `clear` metadata where `true` means clear `variableName` before evaluating and writing `valueExpression`.
- Add Evaluator config-level Label behavior equivalent to existing variable-producing node labels.
- Preserve new fields through normalization, domain import/export, clipboard, and backend export.
- Keep existing saved workflows importable by supplying defaults for newly introduced config keys.

**Non-Goals:**
- Add runtime execution logic inside the editor package.
- Add additional variable types beyond `string` and `array`.
- Change existing expression syntax, evaluator condition semantics, or evaluator true/false branch handles.
- Rename existing node title labels such as `Extractor`, `Setter`, or `Evaluator`.

## Decisions

### Store new behavior in node config

Extractor receives `config.variableType`, Setter receives `config.clear`, and Evaluator receives `config.label`.

Rationale: config already roundtrips through the domain DTO and backend DTO, and the schema-driven normalization layer already defaults missing config keys. Keeping these fields in config avoids a parallel persistence path and keeps import validation explicit.

Alternative considered: store variable type and clear behavior in node metadata. That would require extending the domain contract outside the existing node config normalization path and would make backend export less direct.

### Use definition defaults for backward compatibility

Existing workflows will not contain the new keys. The node definitions should default Extractor `variableType` to `string`, Setter `clear` to `false`, and Evaluator `label` to `conditionMatched`.

Rationale: existing import behavior normalizes missing keys from `buildDefaultConfig()`, so adding defaults keeps old payloads valid without migration code.

Alternative considered: leave defaults empty and force users to configure them. That would make evaluator label less useful and could create invalid or absent downstream variable entries.

### Treat Evaluator as a variable-producing node

Evaluator `config.label` should use the same identifier field hook and rename-aware behavior as Setter and Extractor. Downstream expression variable collection should include upstream evaluator nodes by reading `config.label` when it is a valid JavaScript identifier.

Rationale: the user-facing request says evaluator Label should work by analogy with the others. The existing rename behavior is definition-driven through `renameConfigKey`, so evaluator can join the pattern by declaring `renameConfigKey: "label"` and by being included in variable collection.

Alternative considered: make evaluator Label purely display-only. That would not match the requested analogy and would leave downstream expressions unable to reference evaluator results.

### Keep variable type metadata editor-owned, not expression-editor-owned

The reusable expression editor currently accepts simple variable options with value, label, description, and group. This change does not require changing expression syntax or insertion behavior. Variable type can be surfaced in descriptions later, but expression editing should continue to insert the variable identifier.

Rationale: this avoids widening the reusable editor contract before there is a concrete need for type-aware autocomplete behavior.

Alternative considered: extend `ExpressionVariableOption` with a `type` field now. That may be useful later, but is not required to persist type metadata or satisfy current UI behavior.

## Risks / Trade-offs

- Existing hardcoded variable producer list omits Evaluator -> Include evaluator in variable collection tests so downstream autocomplete covers it.
- New config keys can be rejected by import if definitions are incomplete -> Update `buildDefaultConfig` and `validateConfigValue` together for each node.
- Evaluator label can collide with upstream variables -> Reuse existing identifier validation and existing rename/refactor patterns; preserve current duplicate handling policy unless a separate uniqueness requirement is introduced.
- Backend runtime semantics for `clear` live outside this editor -> Persist `clear` clearly in backend export and document that runtime consumers MUST clear before writing.

## Migration Plan

1. Add config defaults and validation for the new fields.
2. Update node UI controls and tests.
3. Update variable collection and rename-aware behavior for evaluator label.
4. Update persistence/backend export tests to prove the fields roundtrip.
5. Existing workflows import with default values; rollback removes UI use while old payloads containing the new keys would require mapper support or payload cleanup.
