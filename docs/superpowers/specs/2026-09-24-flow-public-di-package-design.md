# `@flow/flow` как публичный DI-пакет

**Дата:** 2026-09-24
**Статус:** дизайн согласован, реализация отложена
**Ветка на момент написания:** `feat/zu-store-migration`

## Цель

Превратить `packages/flow` из внутреннего пакета продукта в публикуемый пакет,
пригодный для переиспользования другими командами: ядро не должно знать ни об
одном конкретном типе узла, а всё продуктовое (встроенные узлы, формат
бэкенда) — уезжать в отдельные точки входа.

## Принятые решения

| Развилка | Решение |
|---|---|
| Потребитель | Внутренние команды, внутренний npm-registry. Tailwind 4 + shadcn-токены остаются заявленным контрактом, не боремся |
| Границы ядра | Ветвление остаётся в ядре, но как абстракция из `NodeDefinition`. Встроенные узлы и backend-export — в subpath'ы |
| Форма ветвления | N веток сразу (`branches: BranchDefinition[]`), true/false — частный случай из двух |
| Настройка текстов | Два механизма: узлы — композиция определений, шелл редактора — словарь `labels` |
| Граф и IO | Uncontrolled + `onGraphChange`/`onError`. Полноценный controlled-режим не делаем |

## Текущее состояние DI

Уже инжектится:

- узлы — `definitions` + `defineNode`/`createNodeRegistry`, subpath `@flow/flow/nodes`
- композиция — `WorkflowProvider` + части `WorkflowEditor.*`, headless-режим
- видимость переменных — `runtime.variables.scope` (`upstreamScope`/`graphScope`/свой)
- значения select'ов — `runtime.nodeOptions`; операторы — `runtime.evaluator.operators`
- маппинг DTO — `runtime.importDomain/exportDomain.mapper`
- режим — `mode: "edit" | "observe"` + `overlay`

## Найденные дыры

Встроенные узлы протекли в ядро:

1. `workflow/types/branching.ts` — `BRANCHING_NODE_KINDS = new Set(["evaluator", "jsonEvaluator"])`
   и литералы `evaluator-true`/`evaluator-false`. Кастомный узел не может ветвиться.
2. `workflow/mappers/backend-export/` знает про те же хэндлы — формат бэкенда зашит в ядро.
3. `NodeCategory` — закрытый union `"control" | "logic" | "data" | "io"`.
4. `NodeKind` / `NodeConfigByKind` в типах ядра перечисляют встроенные kinds.
5. `runtime.evaluator.operators` — конфигурация конкретного узла в конфиге ядра.

Закрытые точки расширения:

6. `FieldType` — закрытый union из пяти значений, `ui: "default" | "expression"`.
   Хост может подменить только весь `view` узла, но не добавить свой контрол в конфиг-панель.
7. `icon: LucideIcon` — прибито к `lucide-react`.
8. `validateConnection` — фиксированные правила, без хука на свои.
9. Хоткеи вешаются на `window` с фиксированными комбинациями, без отключения.
10. `elkjs` зашит в layout, не подменить и не сделать опциональным.

Отсутствует:

11. i18n — все строки английские и зашиты (тулбар, палитра, тексты ошибок в `validation.ts`).
12. У `WorkflowProvider` нет ни одного колбэка: ни `onChange`, ни `onError`.

Блокеры публикации:

13. `private: true`, `version: 0.0.0`, `exports` указывают на сырой `./src/index.tsx` — нет сборки и `.d.ts`.
14. `react`, `react-dom`, `@xyflow/react` не в `peerDependencies`.
15. `@flow/ui` и `@flow/expression-editor` — оба `private: true`, снаружи пакет не установится.
16. В `packages/flow/src/**` лежат каталоги `.omc/state/sessions/**`, которые попадут в пакет.

## Дизайн

### 1. Границы: три точки входа

| Точка входа | Содержимое |
|---|---|
| `@flow/flow` | Ядро. Не знает ни одного `kind`. Store, canvas, палитра, конфиг-панель, тулбар, реестр, scope переменных, каркас валидации |
| `@flow/flow/nodes` | Готовые узлы: `evaluator`, `jsonEvaluator`, `setVariable`, `inlineExpression`, `extractor`, `pathExtractor`, `result` — вместе с типами их конфигов |
| `@flow/flow/backend` | Экспорт в формат бэкенда: `BackendWorkflowDTO`, `exportDomainWorkflowForBackend`, `exportDraftDomainWorkflowForBackend` |

Переезжает из ядра:

- `workflow/types/branching.ts` — константы хэндлов и список ветвящихся kinds → в узлы;
  ядро получает обобщённый branch-API (см. §2)
- `NodeKind` в ядре становится `string`; `NodeConfigByKind`, `EvaluatorNodeConfig`,
  `ExtractorNodeConfig`, `SetVariableNodeConfig`, `ResultNodeConfig`,
  `InlineExpressionNodeConfig`, `JsonEvaluatorNodeConfig` → в `/nodes`
- `workflow/mappers/backend-export/` и `Backend*DTO` → в `/backend`
- `runtime.evaluator.operators`, `WorkflowEvaluatorOperatorCatalog`,
  `DEFAULT_EVALUATOR_OPERATOR_*` → в `/nodes`, поверх обобщённого механизма:

```ts
runtime.nodes?: Record<string, unknown>
// узел читает свою настройку хуком useNodeRuntimeConfig(kind)
```

Тогда `evaluator` берёт операторы тем же способом, каким чужой узел возьмёт свою настройку.
`runtime.nodeOptions` остаётся как есть — он уже обобщён по kind.

### 2. `NodeDefinition` v2

```ts
interface BranchDefinition {
  id: string
  label?: string
  labelClassName?: string
}

interface NodeDefinition<K extends string = string> {
  icon: ComponentType<{ className?: string }>  // было LucideIcon
  category: string                             // было закрытый union
  branches?: BranchDefinition[]                // N веток; поля нет = один выход
  // остальные поля без изменений
}
```

`branches` поглощает нынешний `outputs?: OutputHandle[]` и полностью заменяет
`isBranchingKind`. Все читатели переезжают на `getBranches(registry, kind)`:

- геометрия хэндлов в `workflow/nodes/node-shell`
- ELK-порты `workflow/layout/elk-ports.ts`
- quick-add и вставка узла в ребро (`store/edge-insertion.ts`, `store/geometry.ts`)
- `validateConnection`: вместо «must use a true or false output handle» —
  «`sourceHandle` должен быть одним из объявленных `branches[].id`»

Категории палитры: `runtime.categories?: { id: string; label: string; order?: number }[]`.
Неизвестная категория падает в конец списка.

### 3. Поля: реестр рендереров

`FieldType` раскрывается через уже применяемый в коде приём `KnownOr<...>`, плюс:

```ts
runtime.fieldRenderers?: Record<string, ComponentType<FieldRendererProps>>

interface FieldRendererProps {
  field: NodeFieldSchema
  value: unknown
  onChange: (next: JsonValue) => void
  disabled: boolean
  nodeId: string
}
```

Конфиг-панель ищет рендерер по `field.type`, фолбэк — встроенные пять.
Это закрывает «хочу свой контрол в панели», не заставляя переписывать весь `view` узла.

### 4. Тексты

**Узлы — композиция определений.** Добавляется `extendNode(base, patch)` в
`node-registry`, чтобы `{ ...evaluator, title }` не терял вложенное: патч `fields`
идёт по `key`, а не заменой всего массива.

**Шелл — словарь.** `runtime.labels?: Partial<WorkflowEditorLabels>`, плоский
словарь строковых ключей. Дефолт — текущие английские строки.

Следствие: `validateConnection` сейчас возвращает `reason` готовой английской
строкой, переводить нечего. Переводим на `{ code: string; params?: Record<string, string> }`,
резолв через `labels`.

### 5. Наблюдаемость и IO

```ts
onGraphChange?(
  graph: WorkflowGraphState,
  meta: { source: "user" | "import" | "history" }
): void

onError?(error: WorkflowError): void
```

Граф остаётся в store пакета, дебаунс — забота хоста. `meta.source` нужен, чтобы
autosave не срабатывал на undo и на собственном импорте.

### 6. Остальные точки DI

- **Хоткеи:** `runtime.hotkeys?: false | Partial<HotkeyMap>`. Сейчас
  `window.addEventListener` в четырёх местах `workflow-editor.tsx` — перевешиваем
  на корень редактора, иначе встроенный в чужое приложение редактор забирает
  Ctrl+Z у всей страницы.
- **Layout:** `runtime.layout?: LayoutEngine` с интерфейсом
  `(graph) => Promise<Record<string, XYPosition>>`; elk-реализация уезжает в
  `@flow/flow/layout-elk` опциональным импортом.
- **Экспрешен-движок оставляем как есть.** DI на scope уже существует, подмену
  CodeMirror/acorn никто не запрашивал — YAGNI.

### 7. Упаковка

- `private: false`, версия `0.1.0`, `publishConfig.registry`
- Сборка в `dist` (ESM + `.d.ts`), `exports` указывают на `dist`, `files: ["dist"]`
- `peerDependencies`: `react`, `react-dom`, `@xyflow/react`
- `@flow/ui` и `@flow/expression-editor` публикуются тем же релизом
- Контракт CSS-токенов (Tailwind 4 + shadcn-переменные) документируется в README
- Удалить `packages/flow/src/**/.omc/` из репозитория и добавить в `.gitignore`

## Порядок работ

1. **Границы типов.** `NodeKind → string`, вынос evaluator-типов и backend-export в subpath'ы,
   `runtime.evaluator` → `runtime.nodes[kind]`
2. **N-арные `branches`.** Определение → геометрия хэндлов, ELK-порты, валидация связей, quick-add
3. **Открытие контрактов.** `icon`, `category` + `runtime.categories`, `fieldRenderers`
4. **Тексты.** `runtime.labels`, коды ошибок валидации, хоткеи на корень редактора
5. **IO.** `onGraphChange` / `onError`, layout как подключаемый движок
6. **Упаковка.** Сборка, peerDeps, публикация трёх пакетов

Срезы 1 и 2 ломают публичные типы, поэтому делаются **до** первой публикации —
сейчас это бесплатно.

## Тестирование

Проект на vitest, порог покрытия для `flow` — 70%. Каждый срез начинается с
красного теста. Площадка уже есть: `workflow/node-registry/extensible-registry.test.tsx`.

Ключевые новые тесты:

- кастомный узел с тремя ветками рисует три хэндла, валидирует связи по их `id`
  и раскладывается ELK (срез 2)
- кастомный `fieldRenderer` подменяет встроенный контрол в конфиг-панели, а
  незнакомый `field.type` падает на фолбэк (срез 3)
- `runtime.labels` перекрывает строку тулбара и текст ошибки валидации (срез 4)
- `onGraphChange` вызывается с `source: "history"` на undo и не вызывается на
  чтении графа (срез 5)

## Что осознанно не делаем

- Полноценный controlled-режим графа — конфликтует со встроенной историей undo/redo
  и бьёт по производительности на каждом движении ноды
- Подмена движка выражений (CodeMirror, acorn, синтаксис шаблонов)
- Полноценная i18n-машина с плюрализацией и локалями — достаточно словаря
- Theming API сверх `className` на частях редактора
