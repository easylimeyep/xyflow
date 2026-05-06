## 1. Canvas Selection Behavior

- [x] 1.1 Import `SelectionMode` from `@xyflow/react` in the workflow canvas.
- [x] 1.2 Configure the workflow canvas `ReactFlow` component with partial selection mode.
- [x] 1.3 Preserve existing `selectionOnDrag`, panning, zooming, connection validation, and selection routing behavior.

## 2. Regression Coverage

- [x] 2.1 Update the workflow canvas React Flow test mock to capture and render the `selectionMode` prop.
- [x] 2.2 Assert the workflow canvas passes partial selection mode to React Flow.
- [x] 2.3 Ensure existing selection routing tests still pass.

## 3. Validation

- [x] 3.1 Run the focused workflow canvas test suite.
- [x] 3.2 Run the relevant package lint/typecheck command if available.
- [ ] 3.3 Manually inspect drag selection in the workflow canvas to confirm partially overlapped nodes become selected.
