## 1. Config Schema and Types

- [x] 1.1 Add a shared variable type union for supported values `string` and `array`.
- [x] 1.2 Extend `ExtractorNodeConfig` with `variableType` and default it to `string`.
- [x] 1.3 Extend extractor node definition validation to accept only `string` and `array` for `variableType`.
- [x] 1.4 Extend `SetVariableNodeConfig` with `clear` and default it to `false`.
- [x] 1.5 Extend setter node definition validation to accept boolean `clear`.
- [x] 1.6 Extend `EvaluatorNodeConfig` with `label` and default it to `conditionMatched`.
- [x] 1.7 Extend evaluator node definition validation and rename metadata for `label`.

## 2. Node UI

- [x] 2.1 Add an Extractor type select next to or near the Label field with `string` and `array` options.
- [x] 2.2 Commit Extractor type changes through `updateNodeConfig` using key `variableType`.
- [x] 2.3 Add a Setter `Clear` checkbox that commits boolean values through `updateNodeConfig` using key `clear`.
- [x] 2.4 Add an Evaluator `Label` input using the existing variable identifier field behavior.
- [x] 2.5 Ensure Evaluator Label validation errors are displayed inline and invalid values are not committed.

## 3. Variable Discovery and Refactoring

- [x] 3.1 Treat evaluator nodes as variable-producing nodes in workflow variable collection.
- [x] 3.2 Read evaluator variables from `config.label` when it is a valid JavaScript identifier.
- [x] 3.3 Preserve existing upstream reachability filtering for evaluator variables.
- [x] 3.4 Ensure evaluator label updates trigger rename-aware downstream expression refactoring.

## 4. Persistence and Backend Export

- [x] 4.1 Add domain roundtrip coverage for extractor `variableType`, setter `clear`, and evaluator `label`.
- [x] 4.2 Add clipboard roundtrip coverage for extractor `variableType`, setter `clear`, and evaluator `label`.
- [x] 4.3 Add backend export coverage proving the new config fields are preserved.
- [x] 4.4 Add legacy import coverage proving missing new fields normalize to defaults.

## 5. Verification

- [x] 5.1 Update extractor component tests for the variable type select and config update.
- [x] 5.2 Update setter component tests for the Clear checkbox and config update.
- [x] 5.3 Update evaluator component tests for Label rendering, valid commits, and invalid input rejection.
- [x] 5.4 Update variable collection tests for downstream evaluator label availability.
- [x] 5.5 Run the relevant package test suite for workflow config, node components, mappers, and variable discovery.
