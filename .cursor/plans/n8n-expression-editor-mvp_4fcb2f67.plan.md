---
name: n8n-expression-editor-mvp
overview: Доработать существующий workflow editor до n8n-подобного mixed-режима полей с `{{ ... }}` и автодополнением переменных из reachable upstream-нод без исполнения выражений на MVP.
todos:
  - id: dep-and-input-component
    content: Подключить CodeMirror 6 и создать компонент ExpressionInput для mixed-текста с {{...}}.
    status: completed
  - id: panel-integration
    content: Интегрировать ExpressionInput в NodeConfigPanel через расширение схемы полей ноды.
    status: completed
  - id: variables-context
    content: Реализовать вычисление reachable upstream-контекста и каталог переменных n8n-стиля по label.
    status: completed
  - id: syntax-validation
    content: Добавить парсер шаблона и проверку синтаксиса JS-выражений без eval.
    status: completed
  - id: mappers-roundtrip
    content: Обновить импорт/экспорт и нормализацию expression-полей в mappers.
    status: completed
  - id: tests-and-regression-check
    content: Добавить unit/component тесты и проверить, что undo/redo и производительность не деградировали.
    status: completed
isProject: false
---

# План: n8n-like Expression Editor MVP

## Зафиксированные решения

- Формат полей: `mixed literal + expression` (текст с вставками `{{ ... }}`).
- На MVP: не исполняем выражения, только хранение + подсветка/валидация синтаксиса.
- Область переменных: n8n-like (текущий input + reachable upstream-ноды).
- Синтаксис ссылок: n8n-стиль `$("Node Label").item.json.field`.
- Редактор: CodeMirror 6.

## Что меняем в кодовой базе

- Точки интеграции UI и формы:
  - `[packages/flow/src/workflow/components/node-config-panel.tsx](packages/flow/src/workflow/components/node-config-panel.tsx)`
  - `[packages/flow/src/workflow/components/workflow-editor.tsx](packages/flow/src/workflow/components/workflow-editor.tsx)`
- Типы/реестр/модель данных:
  - `[packages/flow/src/workflow/types.ts](packages/flow/src/workflow/types.ts)`
  - `[packages/flow/src/workflow/node-registry.ts](packages/flow/src/workflow/node-registry.ts)`
  - `[packages/flow/src/workflow/store.ts](packages/flow/src/workflow/store.ts)`
- Импорт/экспорт и нормализация:
  - `[packages/flow/src/workflow/mappers.ts](packages/flow/src/workflow/mappers.ts)`

## Архитектура решения

```mermaid
flowchart LR
  graphState[WorkflowGraphState]
  reachableCalc[ReachableUpstreamResolver]
  varsCatalog[VariablesCatalog]
  exprInput[ExpressionInput(CodeMirror6)]
  templateParser[TemplateParser{{...}}]
  syntaxCheck[ExpressionSyntaxCheck]
  configStore[NodeConfigStore]
  jsonMapper[ImportExportMapper]

  graphState --> reachableCalc
  reachableCalc --> varsCatalog
  varsCatalog --> exprInput
  exprInput --> templateParser
  templateParser --> syntaxCheck
  exprInput --> configStore
  configStore --> jsonMapper
```

## Этапы реализации

- Добавить новый reusable-компонент `ExpressionInput` (CodeMirror 6) с:
  - mixed-редактированием текста,
  - вставкой переменных из пикера,
  - подсветкой `{{ ... }}` и inline-ошибками синтаксиса.
- В `NodeConfigPanel` заменить `textarea/text` для целевых полей на `ExpressionInput` через расширение схемы поля (например, `ui: "expression"`), не ломая остальные типы полей.
- Реализовать `ReachableUpstreamResolver`:
  - обход графа от выбранной ноды назад по `edges`,
  - сбор переменных текущего input и upstream-нод,
  - формирование каталога автодополнения в n8n-стиле по `label`.
- Добавить минимальную модель output-схем для нод в реестре, чтобы давать подсказки по путям (`json.field`), без runtime-исполнения.
- Реализовать безопасную валидацию синтаксиса без eval:
  - парсинг шаблона на literal/expression сегменты,
  - проверка выражений как JS-expression parser-ом,
  - хранение ошибок на уровне UI (без блокировки сохранения при warning-режиме).
- Обновить `mappers.ts`, чтобы mixed-строки с `{{...}}` стабильно импортировались/экспортировались и не терялись при round-trip JSON.
- Добавить тесты:
  - unit: resolver reachable upstream, parser `{{...}}`, label-based reference generation,
  - component: редактирование/вставка переменной в `NodeConfigPanel`,
  - mapper round-trip для expression-полей.

## Пакеты и зависимости

- UI editor: `@codemirror/*` (+ React-обёртка).
- Парсинг выражений: лёгкий JS expression parser (без выполнения кода).
- Важно: не добавлять runtime-eval в браузере на этом этапе.

## Критерии готовности

- Пользователь может вводить текст с `{{ ... }}` в конфиге ноды.
- В редакторе доступны автоподсказки переменных из reachable upstream-ноды и текущего input.
- Ошибки синтаксиса выражений видны в UI.
- JSON import/export сохраняет выражения без искажений.
- Undo/redo работает без заметных регрессий UX.
