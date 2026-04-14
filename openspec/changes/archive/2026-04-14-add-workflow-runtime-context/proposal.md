## Why

`packages/flow` уже умеет импортировать и экспортировать domain JSON, но сейчас этот путь полностью зашит внутрь store/UI и не допускает внешнего runtime-расширения. Ближайшая потребность - дать потребителю возможность перехватить результат `export domain` и дополнительно преобразовать его перед копированием, при этом решение должно сразу масштабироваться на будущие внешние настройки и интеграционные хуки.

## What Changes

- Добавить универсальный runtime-конфиг для workflow, который можно передавать извне при инициализации `Flow` / `WorkflowStoreProvider`.
- Зафиксировать первый расширяемый контракт в этом runtime-конфиге: кастомный mapper для `export domain`, работающий с domain DTO до сериализации в JSON.
- Перенести `export domain` pipeline на двухшаговую модель: базовое построение стабильного domain payload object, затем опциональное внешнее преобразование через runtime hook и только после этого сериализация в JSON.
- Сохранить дефолтное поведение без изменений для текущих потребителей, если внешний runtime-конфиг не передан.
- Покрыть контракт тестами на уровне store/provider/UI-интеграции, чтобы расширяемость не ломала текущий clipboard/export flow.

## Capabilities

### New Capabilities
- `workflow-runtime-context`: универсальный runtime-контракт для внешних настроек и интеграционных hooks, доступный store и UI-слою workflow.

### Modified Capabilities
- `workflow-persistence-v2`: domain export расширяется опциональным runtime post-processing шагом без изменения базовой schema-driven сериализации.

## Impact

- `packages/flow/src/index.tsx`
- `packages/flow/src/workflow/store/store.ts`
- `packages/flow/src/workflow/store/types.ts`
- `packages/flow/src/workflow/store/slices/io-slice.ts`
- `packages/flow/src/workflow/components/editor-toolbar/editor-toolbar.tsx`
- Тесты вокруг `WorkflowStoreProvider`, toolbar export и store IO behavior
