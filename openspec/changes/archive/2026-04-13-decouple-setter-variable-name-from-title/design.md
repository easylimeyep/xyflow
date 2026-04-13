## Context

Сейчас `SetVariableNode` использует `data.label` одновременно как заголовок узла и как значение поля `Variable name`. Поэтому любое изменение имени переменной меняет title узла. В кодовой базе уже есть отдельное поле `config.variableName` и требования OpenSpec для rename-aware config updates, но текущая реализация не доведена до конца: `setVariable` definition не объявляет `renameConfigKey`, а переменные для expression selector берутся из `label`.

## Goals / Non-Goals

**Goals:**
- Развязать `setVariable` node title (`data.label`) и variable identifier (`data.config.variableName`)
- Сохранить UX: редактирование `Variable name` не меняет заголовок узла
- Обеспечить рефактор plain-variable ссылок при изменении `config.variableName`
- Сделать источник переменных в expression selector консистентным с `config.variableName`

**Non-Goals:**
- Редизайн NodeShell или визуального стиля узлов
- Изменение поведения других node kinds, кроме `setVariable`
- Полная миграция исторических выражений со старой label-семантики (кроме автоматического rename-refactor при изменении `variableName`)

## Decisions

### Decision: Поле `Variable name` пишет в `config.variableName`, а не в `data.label`

`SetVariableNode` будет читать текущее имя переменной из `config.variableName` (с fallback на валидный derived value) и коммитить через `updateNodeConfig(..., key: "variableName")`.

Альтернатива: оставить запись в `label` и синхронизировать `variableName` вторично. Отклонено, потому что сохраняет источник бага и двойную ответственность одного поля.

### Decision: Включить rename-aware поведение через `NodeDefinition.renameConfigKey`

В `set-variable/definition.ts` добавляется `renameConfigKey: "variableName"`, а `buildDefaultConfig` возвращает `variableName` вместе с `valueExpression`.

Альтернатива: хардкодить `setVariable` в `node-config-updates.ts`. Отклонено, потому что это нарушает существующую extensible-модель capability `store-extensible-node-config`.

### Decision: Рефактор выражений при update `variableName` делать в `applyNodeConfigUpdate`

`applyNodeConfigUpdate` перед обновлением графа проверяет `definition.renameConfigKey`, и если меняется строковый rename-key, применяет `refactorPlainVariableReferencesInGraph`.

Альтернатива: рефакторить только в UI-компоненте Setter. Отклонено, потому что ломает единую точку инвариантов store-layer и не покрывает программные вызовы store-команд.

### Decision: Для `setVariable` expression variables строятся из `config.variableName`

В `collectWorkflowVariables` значение переменной для `setVariable` берётся из `config.variableName` (fallback на label только для обратной совместимости старых данных).

Альтернатива: оставить `label` как источник. Отклонено, потому что это продолжает расхождение между UI-полем `Variable name` и фактическими переменными в expression picker.

## Risks / Trade-offs

- [Старые графы без `config.variableName`] -> Использовать fallback на `label` и сохранять новое значение при первом редактировании
- [Коллизии имён переменных между несколькими `setVariable`] -> Применить существующую дедупликацию JS identifier для variable names при коммите
- [Пользователи привыкли к текущей связке label/name] -> Явно закрепить новое поведение тестами и spec-scenarios

## Migration Plan

1. Обновить `setVariable` definition (`renameConfigKey`, default `variableName`).
2. Обновить store-layer (`applyNodeConfigUpdate`) для rename-refactor по `renameConfigKey`.
3. Обновить `SetVariableNode` на commit в `updateNodeConfig(variableName)`.
4. Обновить expression variables collector для `setVariable`.
5. Обновить/добавить unit tests для node UI, store updates, variable selector и regression на неизменность заголовка.
6. Прогнать целевые тесты и убедиться, что change apply-ready.

## Open Questions

_(none)_
