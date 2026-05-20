## 1. Evaluator Defaults

- [x] 1.1 Change Evaluator definition default `label` to an empty string.
- [x] 1.2 Change Evaluator default `outputPaths` behavior so `conditionMatched` is not exposed by default.
- [x] 1.3 Remove Evaluator component fallback that renders empty `config.label` as `conditionMatched`.
- [x] 1.4 Keep a UI placeholder for the Evaluator Label input.
- [x] 1.5 Update Evaluator tests for empty stored default, placeholder rendering, valid label commit, and invalid label rejection.

## 2. Setter Defaults

- [x] 2.1 Change Setter definition default `variableName` to an empty string.
- [x] 2.2 Ensure Setter Label input renders empty value with placeholder guidance.
- [x] 2.3 Update Setter tests and default config assertions that currently expect `myVar`.

## 3. Keyword Placeholder

- [x] 3.1 Change Keyword field metadata placeholder from `{{ myVariable }}` to `token`.
- [x] 3.2 Change Keyword token row `ExpressionInput` placeholder from `{{ myVariable }}` to `token`.
- [x] 3.3 Update Keyword component tests that query or assert the old placeholder.

## 4. Variable Discovery and Persistence

- [x] 4.1 Verify empty Evaluator labels are not included in downstream expression variable catalogs.
- [x] 4.2 Verify explicit Evaluator labels such as `conditionMatched` are still preserved and discoverable.
- [x] 4.3 Verify explicit Setter variable names such as `myVar` are still preserved in import, clipboard, and export fixtures.
- [x] 4.4 Update normalization/import tests so missing Evaluator/Setter label keys normalize to empty strings.

## 5. Verification

- [x] 5.1 Run focused tests for Evaluator, Setter, Keyword, node registry/default config, variable discovery, clipboard, and backend export.
- [x] 5.2 Run package lint/typecheck or the closest existing package verification command if available.
