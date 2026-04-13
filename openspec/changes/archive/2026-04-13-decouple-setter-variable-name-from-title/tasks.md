## 1. SetVariable Definition And Store Semantics

- [x] 1.1 Обновить `packages/flow/src/workflow/nodes/data/set-variable/definition.ts`: добавить `renameConfigKey: "variableName"` и дефолт `variableName` в `buildDefaultConfig`
- [x] 1.2 Обновить `packages/flow/src/workflow/store/node-config-updates.ts`: при изменении rename-key в строковое значение запускать `refactorPlainVariableReferencesInGraph`
- [x] 1.3 Добавить/обновить тесты `node-config-updates.test.ts` для сценариев rename `variableName` и non-rename `valueExpression`

## 2. Setter UI And Variable Catalog

- [x] 2.1 Обновить `packages/flow/src/workflow/nodes/data/set-variable/set-variable-node.tsx`: поле `Variable name` должно коммитить в `updateNodeConfig(..., key: "variableName")`, не в `updateNodeLabel`
- [x] 2.2 Обновить `packages/flow/src/workflow/expression/variables/variables.ts`: для `setVariable` использовать `config.variableName` (с fallback), для `extractor` оставить label-based поведение
- [x] 2.3 Обновить unit tests `set-variable-node.test.tsx` и `variables.test.ts` под новую семантику

## 3. Regression Coverage And Verification

- [x] 3.1 Добавить/обновить store-level regression тест: изменение `variableName` в `setVariable` не меняет `data.label`
- [x] 3.2 Добавить/обновить store-level regression тест: при rename `variableName` expression references рефакторятся
- [x] 3.3 Прогнать целевые тесты пакета `flow` и убедиться, что изменения не ломают существующие сценарии
