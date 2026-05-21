## 1. Tests

- [x] 1.1 Add evaluator component coverage proving that clearing the Label input commits `config.label` as an empty string and does not show the required-field error.
- [x] 1.2 Add evaluator component coverage proving that invalid non-empty labels still do not commit and still show the invalid-identifier error.
- [x] 1.3 Add node config update coverage proving that changing evaluator `config.label` from a valid identifier to an empty string leaves downstream expression references unchanged.
- [x] 1.4 Add metadata shape coverage proving evaluator label updates do not add `labelType` or `variableType`, while setter/extractor producer label and type storage remain unchanged.

## 2. Implementation

- [x] 2.1 Extend `useVariableIdentifierField` with an opt-in empty-value mode that commits `""` for empty drafts and keeps the default required behavior for existing callers.
- [x] 2.2 Enable the empty-value mode for the evaluator Label input only.
- [x] 2.3 Update config rename/refactor hook behavior so downstream expression refactors run only when both previous and next names are non-empty valid JavaScript identifiers.
- [x] 2.4 Confirm evaluator config normalization and DTO mapping continue to store result label at `config.label` without introducing `labelType` or `variableType`.

## 3. Verification

- [x] 3.1 Run targeted evaluator component tests.
- [x] 3.2 Run targeted node config update and expression variable tests.
- [x] 3.3 Run targeted node registry or mapper tests that cover evaluator config normalization and DTO roundtrip.
- [x] 3.4 Run the package test command required by the repository for the touched workflow areas.
