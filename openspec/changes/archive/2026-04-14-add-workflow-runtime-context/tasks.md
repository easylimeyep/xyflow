## 1. Runtime Contract

- [x] 1.1 Добавить `WorkflowRuntimeConfig` и расширить `WorkflowStoreInitialProps` namespaced-полем `runtime`
- [x] 1.2 Сохранить runtime-конфиг в store initialization path как mount-scoped read-only runtime state
- [x] 1.3 Экспортировать новые runtime-типы из публичного `packages/flow` entrypoint, если они нужны внешним consumers

## 2. Export Domain Extensibility

- [x] 2.1 Обновить IO-layer так, чтобы `exportDomain` сначала строил базовый schema-driven payload, а затем опционально применял `runtime.exportDomain` mapper
- [x] 2.2 Зафиксировать дефолтный no-op path: без runtime mapper результат `exportDomain` полностью совпадает с текущим поведением
- [x] 2.3 Убедиться, что toolbar и copy/export flow используют итоговый post-processed payload без дублирования runtime-логики в UI

## 3. Provider And Consumer Surface

- [x] 3.1 Обновить `Flow` и `WorkflowStoreProvider` usage так, чтобы consumer мог передавать `runtime` извне без breaking default path
- [x] 3.2 Добавить пример/тест consumer-сценария с кастомным `export domain` mapper, который получает текущую экспортируемую строку и возвращает модифицированный payload
- [x] 3.3 Подтвердить тестом mount-time semantics: rerender provider с новым runtime не меняет уже созданный store instance

## 4. Verification

- [x] 4.1 Обновить unit/integration tests для store/provider/export toolbar на дефолтный и кастомный runtime paths
- [x] 4.2 Прогнать таргетные `vitest` тесты для `packages/flow` и проверить, что runtime extensibility не ломает текущий import/export behavior
