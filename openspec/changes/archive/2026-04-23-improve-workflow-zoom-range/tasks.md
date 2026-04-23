## 1. Workflow Canvas Zoom Bounds

- [x] 1.1 Add explicit workflow zoom constants for minimum `0.1` and maximum `4`.
- [x] 1.2 Pass the workflow zoom constants to the `ReactFlow` canvas via `minZoom` and `maxZoom`.
- [x] 1.3 Pass the same zoom constants to the auto-layout `fitView` call.

## 2. Tests

- [x] 2.1 Update the workflow canvas React Flow mock to expose received `minZoom` and `maxZoom` props.
- [x] 2.2 Add or update tests proving the canvas configures React Flow with the workflow zoom bounds.
- [x] 2.3 Add or update tests proving auto-layout refit uses the same workflow zoom bounds.

## 3. Verification

- [x] 3.1 Run the focused workflow canvas test suite.
- [x] 3.2 Run OpenSpec validation for `improve-workflow-zoom-range`.
