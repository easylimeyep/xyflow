# workflow editor perf budget

Date: 2026-03-29

## Budget rules

- Pointer-only updates must not rerender non-canvas containers (`palette`, `config panel`).
- Viewport-only updates must not rerender non-canvas containers.
- Expression variable catalog selector should keep stable references when `nodes`, `edges`, and `nodeId` are unchanged.

## Guardrails

- `workflow-editor.test.tsx`
  - `does not rerender config panel and palette on viewport-only updates`
  - `keeps non-canvas render budget stable on pointer updates`
