## 1. Extractor Variable Label Semantics

- [x] 1.1 Зафиксировать extractor variable config-key (в рамках change: `extractExpression`) как source-of-truth для `Label` и объявить `renameConfigKey` в `packages/flow/src/workflow/nodes/data/extractor/definition.ts`
- [x] 1.2 Обновить `packages/flow/src/workflow/nodes/data/extractor/extractor-node.tsx`: поле `Label` перевести на setter-паттерн (plain input, draft state, JS identifier validation, commit в `updateNodeConfig`)
- [x] 1.3 Добавить/переиспользовать shared variable-input логику для `Setter` и `Extractor`, чтобы избежать дублирования поведения

## 2. Expression Variable Catalog And Rename Refactor

- [x] 2.1 Обновить `packages/flow/src/workflow/expression/variables/variables.ts`: extractor variable брать из `config.extractExpression` (с fallback для legacy-данных)
- [x] 2.2 Подтвердить store-level rename-refactor для extractor через definition-driven `renameConfigKey` в `packages/flow/src/workflow/store/node-config-updates.ts` (без hardcoded node-kind веток)
- [x] 2.3 При необходимости синхронизировать связанные правила уникальности/нормализации переменных в store helper-ах

## 3. Setter UI Unification

- [x] 3.1 Обновить `packages/flow/src/workflow/nodes/data/set-variable/set-variable-node.tsx`: изменить UI-текст поля `Variable name` на `Label`
- [x] 3.2 Обновить связанные unit-тесты `set-variable-node.test.tsx` под новую терминологию

## 4. Regression Coverage And Verification

- [x] 4.1 Обновить/добавить tests: `extractor-node.test.tsx` (Label commit + валидация + независимость от title)
- [x] 4.2 Обновить/добавить tests: `variables.test.ts` (extractor variable source from config, fallback behavior)
- [x] 4.3 Обновить/добавить tests: `node-config-updates.test.ts` и/или `store.test.ts` (rename extractor Label refactors expressions)
- [x] 4.4 Прогнать целевые тесты `flow` и зафиксировать, что change apply-ready
