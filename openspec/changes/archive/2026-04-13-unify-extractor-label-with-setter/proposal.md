## Why

В `Extractor` поле `Label` сейчас не участвует в формировании переменных для downstream expression input так же, как это работает у `Setter` через отдельный variable-input. Из-за этого пользователь вводит имя переменной в одном месте, но не видит консистентной подсветки/автодополнения в остальных expression-полях.

## What Changes

- Для `Extractor` поле `Label` переводится на ту же semantic-модель, что и variable-input в `Setter`: отдельное имя переменной в `config`, независимое от заголовка узла.
- Источник extractor-переменной для expression variable catalog переключается с `node.data.label` на конфиг-поле переменной (с fallback для legacy-данных).
- Переименование extractor variable label должно триггерить graph-wide refactor plain-variable ссылок через существующий rename-aware store механизм (по аналогии с `setVariable`).
- В `Setter` UI-текст поля `Variable name` переименовывается в `Label` для единообразия интерфейса.
- Поведение и контракты покрываются тестами на уровне node UI, variable catalog и store rename-refactor.

## Capabilities

### New Capabilities
- `variable-label-input-unification`: единая UX/поведенческая модель для полей переменной в `Setter` и `Extractor` (независимость от title, единые принципы редактирования и валидации).

### Modified Capabilities
- `store-extensible-node-config`: rename-aware config updates расширяются на extractor variable label key, чтобы переименование переменной в `Extractor` рефакторило ссылки в expression-полях.
- `store-expression-cache`: expression variable selector для `Extractor` использует переменное имя из config-поля, а не `node.data.label`.

## Impact

- `packages/flow/src/workflow/nodes/data/extractor/extractor-node.tsx`
- `packages/flow/src/workflow/nodes/data/extractor/definition.ts`
- `packages/flow/src/workflow/nodes/data/extractor/extractor-node.test.tsx`
- `packages/flow/src/workflow/nodes/data/set-variable/set-variable-node.tsx`
- `packages/flow/src/workflow/nodes/data/set-variable/set-variable-node.test.tsx`
- `packages/flow/src/workflow/expression/variables/variables.ts`
- `packages/flow/src/workflow/expression/variables/variables.test.ts`
- `packages/flow/src/workflow/store/node-config-updates.test.ts`
- `packages/flow/src/workflow/store/store.test.ts`
- `packages/flow/src/workflow/types/types.ts` (если потребуется явный config-key для extractor variable label)
