## Context

После change `2026-04-13-decouple-setter-variable-name-from-title` узел `Setter` уже использует отдельный config-key (`variableName`) как источник переменной для expression-селекторов и rename-refactor.  
В `Extractor` похожая задача не завершена: поле `Label` в UI не является консистентным источником переменной для downstream expression input, а expression catalog читает имя extractor-переменной из `node.data.label`.

Это создает UX-разрыв:
- пользователь вводит переменную в поле `Label` у `Extractor`;
- downstream expression input не ведет себя так же, как при вводе `variableName` у `Setter`;
- терминология расходится (`Variable name` vs `Label`).

## Goals / Non-Goals

**Goals:**
- Сделать для `Extractor` ту же модель переменной, что и для `Setter`: отдельное config-поле переменного имени, независимое от title.
- Переиспользовать логику `Setter` (валидация JS identifier, commit-паттерн, rename-aware refactor через store).
- Привести подписи полей к единому виду: `Label` в `Setter` и `Extractor`.
- Сохранить обратную совместимость по данным и не ломать существующие графы.

**Non-Goals:**
- Редизайн NodeShell/визуального оформления узлов.
- Изменение семантики других node kinds кроме `setVariable` и `extractor`.
- Перестройка общего expression parser/autocomplete beyond extractor/setter variable source alignment.

## Decisions

### Decision: Источник extractor-переменной переносится в config и перестает зависеть от `data.label`

Extractor variable catalog должен использовать dedicated config-key (как у `setVariable`), а не заголовок узла.  
Это выравнивает UX-семантику между `Extractor` и `Setter`.

Альтернатива: оставить `data.label` источником.  
Отклонено: сохраняет текущую проблему несоответствия поля `Label` и подсветки в expression input.

### Decision: Переиспользовать setter-паттерн через shared variable-input логику

Для `Setter` и `Extractor` используется единый паттерн controlled input:
- локальный draft state;
- валидация `isValidJsIdentifier`;
- commit через `updateNodeConfig` на blur/Enter;
- inline error без silent fallback.

Практически это оформляется как shared helper/hook (например, `useVariableIdentifierField`) либо эквивалентный общий util, чтобы не дублировать код.

Альтернатива: copy-paste логики в `ExtractorNode`.  
Отклонено: повышает риск расхождений при будущих изменениях.

### Decision: Rename-refactor для extractor запускается через `renameConfigKey` definition-driven механизм

Extractor definition объявляет rename key, и `applyNodeConfigUpdate` автоматически применяет `refactorPlainVariableReferencesInGraph` при переименовании переменной.

Альтернатива: ручной рефактор только на уровне UI-компонента `ExtractorNode`.  
Отклонено: нарушает store-layer инвариант и не покрывает программные вызовы `updateNodeConfig`.

### Decision: В `Setter` текст поля меняется с `Variable name` на `Label`

Это только UI-унификация терминов, без изменения store-ключей/контрактов `setVariable`.

Альтернатива: оставить старый label в `Setter`.  
Отклонено: усиливает когнитивный разнобой между сходными по смыслу полями.

## Risks / Trade-offs

- [Неочевидный extractor config-key (`extractExpression`)] -> Зафиксировать выбранную стратегию (сохранить ключ для backward compatibility или мигрировать на новый) и покрыть импорт/clipboard тестами.
- [Legacy графы с невалидными именами] -> Ввести явное поведение (валидация + UX-ошибка/нормализация) и закрепить тестами.
- [Переименование может затронуть больше выражений, чем ожидалось] -> Ограничить refactor только plain-variable ссылками и расширить regression tests на non-target expressions.
- [Дубли/конфликты имён между `Extractor` и `Setter`] -> Переиспользовать существующую дедупликацию/уникализацию идентификаторов на уровне store.

## Migration Plan

1. Уточнить и зафиксировать extractor variable config-key strategy (legacy key vs новый key с fallback).
2. Обновить extractor definition (rename key + default/fallback semantics).
3. Вынести и применить shared variable-input логику в `Setter` и `Extractor`.
4. Обновить expression variables selector для extractor source-of-truth из config.
5. Переименовать UI label в `Setter` на `Label`.
6. Добавить/обновить тесты: node UI, variables catalog, node-config updates, store regression.
7. Прогнать целевые тесты пакета `flow`.

## Open Questions

- Какой extractor config-key фиксируем как source-of-truth для variable label:
  - сохранить существующий `extractExpression` (backward-compatible, но менее читаемо), или
  - ввести новый (`variableName`/`label`) с миграционным fallback?
- Нужна ли авто-нормализация невалидного ввода в extractor/setter `Label` (например, `my var` -> `myVar`) или строгая ошибка как сейчас в `Setter`?
- Должен ли extractor `Label` быть уникальным относительно `Setter` переменных в рамках графа (да/нет)?
- Нужно ли в этом change менять только автодополнение/каталог переменных или также визуальную подсветку токена в expression editor (если это разные механизмы)?
