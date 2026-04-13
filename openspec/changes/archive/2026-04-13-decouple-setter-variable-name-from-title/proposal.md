## Why

В узле `Setter` поле `Variable name` сейчас изменяет `data.label`, из-за чего одновременно меняется и заголовок узла. Это ломает ожидаемую UX-модель: имя переменной и заголовок узла должны быть независимыми. Дополнительно это расходится с уже существующей моделью `setVariable` (`config.variableName`) и делает поведение непредсказуемым при редактировании.

## What Changes

- Поле `Variable name` в `Setter` будет читать/писать `config.variableName`, а не `data.label`.
- Заголовок узла (`data.label`) перестанет меняться при редактировании `Variable name`.
- `setVariable` definition будет явно объявлять rename-key для переменной (`renameConfigKey: "variableName"`) и дефолтное значение `variableName`.
- При изменении `config.variableName` будут рефакториться plain-variable ссылки в expression-полях (`{{ oldName }}` -> `{{ newName }}`).
- Каталог переменных для downstream expression autocomplete будет использовать `config.variableName` для `setVariable`, чтобы UI и вычисления ссылались на одно и то же имя.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `store-extensible-node-config`: обновляется поведение rename-aware config updates для `setVariable.variableName` и требование явной конфигурации rename-key в node definition.
- `store-expression-cache`: для `setVariable` источник имени переменной меняется с `node.data.label` на `node.data.config.variableName`.

## Impact

- `packages/flow/src/workflow/nodes/data/set-variable/set-variable-node.tsx`
- `packages/flow/src/workflow/nodes/data/set-variable/definition.ts`
- `packages/flow/src/workflow/store/node-config-updates.ts`
- `packages/flow/src/workflow/expression/variables/variables.ts`
- `packages/flow/src/workflow/store/slices/node-crud-slice.ts` (валидация/рефактор при rename label для `setVariable`)
- Тесты в `set-variable-node.test.tsx`, `node-config-updates.test.ts`, `variables.test.ts`, `store.test.ts`
