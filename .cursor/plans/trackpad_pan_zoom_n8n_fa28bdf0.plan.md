---
name: Trackpad Pan Zoom n8n
overview: "Привести навигацию canvas в `@workspace/flow` к n8n-like поведению для macOS/Chrome: 2-пальцевый свайп = pan, pinch = zoom, без изменения текущей логики выделения мышью."
todos:
  - id: update-reactflow-gesture-props
    content: Обновить props навигации ReactFlow в workflow-canvas под n8n-like trackpad UX
    status: completed
  - id: refresh-canvas-tests
    content: Обновить workflow-canvas.test.tsx под новые pan/zoom props
    status: completed
  - id: run-flow-tests
    content: Прогнать тесты @workspace/flow и проверить отсутствие регрессий
    status: completed
isProject: false
---

# План: n8n-like навигация канваса

## Цель

Сделать поведение канваса в workflow-редакторе предсказуемым на тачпаде (macOS/Chrome):

- 2 пальца (scroll gesture) перемещают viewport
- pinch gesture масштабирует viewport
- drag ЛКМ по пустому месту остается рамкой выделения (не pan)

## Что изменить

- Обновить настройки `ReactFlow` в `[/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.tsx](/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.tsx)`:
  - оставить `selectionOnDrag`
  - оставить `panOnDrag={false}` (как согласовано)
  - включить pan от скролл-жеста (`panOnScroll`)
  - оставить zoom от pinch (`zoomOnPinch`)
  - отключить zoom от обычного scroll (`zoomOnScroll={false}`), чтобы scroll-жест не конфликтовал с pan
- Проверить, что обновление viewport по `onMoveEnd` продолжает синхронизироваться со стором без регрессий.

## Покрытие тестами

- Актуализировать unit-тест канваса в `[/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.test.tsx](/Users/sergejolcev/Desktop/learning-projects/xyflow/packages/flow/src/workflow/components/workflow-canvas.test.tsx)`:
  - зафиксировать новые пропсы (`panOnScroll`, `zoomOnPinch`, `zoomOnScroll=false`)
  - сохранить проверку, что `panOnDrag=false` и `selectionOnDrag=true`

## Валидация

- Прогнать тесты пакета `@workspace/flow` и убедиться, что изменения не ломают существующие сценарии взаимодействий canvas.
