## 1. Mini Map Navigation

- [x] 1.1 Add a mini map click handler in the workflow canvas that centers the main viewport on the clicked flow position.
- [x] 1.2 Preserve the current viewport zoom when mini map click navigation runs.
- [x] 1.3 Animate mini map click navigation with a short 150-250ms transition.
- [x] 1.4 Configure the mini map to support drag panning.
- [x] 1.5 Keep wheel-based mini map zoom disabled.
- [x] 1.6 Ensure clicks on mini map node shapes behave as ordinary mini map point navigation and do not select workflow nodes.

## 2. Mini Map Visual Styling

- [x] 2.1 Configure the mini map viewport mask stroke to use `var(--primary)`.
- [x] 2.2 Increase the mini map viewport mask stroke width above the React Flow default so it remains visible at low zoom.
- [x] 2.3 Apply `radius-md` and `overflow: hidden` to the mini map outer container without changing its current position.
- [x] 2.4 Preserve mini map node shape styling while rounding only the outer container.

## 3. Regression Coverage

- [x] 3.1 Update workflow canvas tests to verify mini map navigation props, including `pannable`, `zoomable={false}`, and click handling.
- [x] 3.2 Add test coverage that click navigation calls the React Flow viewport API with preserved zoom and an animation duration in the accepted range.
- [x] 3.3 Add test coverage that mini map visual props include primary mask stroke color and increased mask stroke width.
- [x] 3.4 Add CSS-level or DOM-level test coverage for mini map `radius-md` clipping if supported by the existing test setup.

## 4. Validation

- [x] 4.1 Run the focused workflow canvas test suite.
- [x] 4.2 Run the relevant package lint/typecheck command if available.
- [x] 4.3 Manually inspect the workflow canvas in-browser at low zoom to confirm the mini map viewport bounds remain visible and click/drag navigation feels correct.
