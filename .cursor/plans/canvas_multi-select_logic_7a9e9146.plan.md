---
name: Canvas Multi-Select Logic
overview: Добавить в workflow-канвас выделение прямоугольником с мыши, синхронизировать состояние выделения в store и отключить контент панели конфигурации при множественном выборе. Должны работать групповое перетаскивание и удаление выделенных нод через Backspace/Delete.
todos:
  - id: enable-marquee-canvas
    content: Включить rectangle selection в workflow-canvas и передавать массив selected node ids
    status: completed
  - id: migrate-store-selection
    content: Перевести store на selectedNodeIds и обновить очистку при удалении нод
    status: completed
  - id: adjust-editor-panel-behavior
    content: Скрыть контент config panel при множественном выборе
    status: completed
  - id: update-tests
    content: Актуализировать тесты store/editor под multi-select сценарии
    status: completed
isProject: false
---

# План внедрения multi-select на canvas

## Что изменим

- Включим прямоугольное выделение в React Flow на канвасе в `[/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.tsx](/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.tsx)`: drag по пустому месту = выделение нод.
- Переведём состояние выделения в store с single-select на multi-select в `[/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/store.ts](/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/store.ts)`, чтобы хранить список выбранных id и корректно очищать его при удалении нод.
- Обновим интеграцию editor-а в `[/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-editor.tsx](/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-editor.tsx)`: при множественном выборе не показывать конфиг-панель (фокус только на group move / delete).
- Сохраним текущую историю изменений (без лишних коммитов истории во время drag) и штатное удаление через клавиши, которое приходит через `onNodesChange`.

## Технические акценты

- Текущий bottleneck в canvas:

```188:191:/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.tsx
onSelectionChange={({ nodes: selectedNodes }) => {
  onSelectNode(selectedNodes[0]?.id ?? null)
}}
```

- Заменим обработку на передачу массива выбранных id.
- В store сейчас single id (`selectedNodeId`); заменим/расширим до `selectedNodeIds: string[]` + helper для получения primary id (первый элемент), чтобы не ломать совместимость в местах, где нужен одиночный выбор.
- В `workflow-editor.tsx` конфиг-панель будет рендериться только при `selectedNodeIds.length === 1`; иначе не рендерим контент панели.

## Проверка результата

- Drag по пустой области выделяет все попавшие ноды (подсветка видна через `NodeProps.selected`).
- Выделенные ноды перемещаются группой обычным перетаскиванием.
- `Backspace/Delete` удаляет весь выбранный набор нод.
- Клик в пустое место очищает выделение.
- Undo/redo после group move и delete работает как прежде.

## Тесты

- Обновить unit-тесты store: очистка `selectedNodeIds` после `remove` в `onNodesChange`.
- Добавить/обновить тесты editor/canvas на поведение множественного выбора и отсутствие панели при `selectedNodeIds.length > 1`.
