## Context

See proposal.md - Why. The relevant mechanics:

- `WorkflowCanvas` holds the initialization overlay while `!nodesInitialized || !allNodesMeasured` (`workflow-canvas.tsx`, the measured initial layout effect).
  - `allNodesMeasured` checks `groupCanvas.visibleNodes`: workflow nodes only, skipping members hidden in collapsed groups.
  - `nodesInitialized` comes from React Flow's `useNodesInitialized()`. In `@xyflow/system` it is computed in `adoptUserNodes` from `userNode.measured` of **every non-hidden node passed to `<ReactFlow>`**, and is only recomputed when the `nodes` prop changes. Internal measurement (`updateNodeInternals`) does not update it.
- `<ReactFlow nodes>` is `groupCanvas.canvasNodes = [...groupNodes, ...visibleNodes]`. Group nodes come from `buildGroupCanvasNode`, which sets `width`/`height` but never `measured`.
- `useNodeChangeRouter` drops every `dimensions` change of a group frame except an active resize, so React Flow's measurement of a frame never reaches the nodes we pass back.
- Result: with any visible group node, `nodesInitialized` is `false` forever.
- `useNodesInitialized` is used nowhere else in the repo. React Flow's own `fitView` queue does not depend on it (`updateNodeInternals` resolves `fitViewQueued` unconditionally), so the overlay gate is the only thing affected.
- Unit tests for the canvas mock all of `@xyflow/react`, including `useNodesInitialized` (always `true`), and jsdom has no `ResizeObserver`, so a real React Flow never measures anything there. This is why the bug escaped.

## Goals / Non-Goals

**Goals:**
- The measured initial layout waits on exactly what the spec names: rendered workflow nodes.
- A regression test that runs a real React Flow in a browser, so the group frame/card is really not measured and the hang would really reproduce.

**Non-Goals:**
- No timeout or fallback for a workflow node that never reports a size.
- No change to how group nodes are built, measured, or resized.
- No change to the manual auto-layout or to `computeWorkflowAutoLayout`.

## Decisions

### D1. Drop `useNodesInitialized` from the wait; keep `allNodesMeasured` as the only measurement gate

`allNodesMeasured` already expresses the requirement (every visible workflow node has `measured.width/height`; an empty graph is handled separately). The measured sizes it reads come from the same source React Flow uses: dimension changes applied by the store to workflow nodes. So for workflow nodes `nodesInitialized` adds nothing, and for derived group nodes it adds a condition that can never be met. Remove the hook call, its variable, and its entry in the effect's dependency list.

Alternative considered — set `measured: { width, height }` on group nodes in `buildGroupCanvasNode`. Rejected:
- It declares a measurement React Flow did not make; if the rendered frame/card differs from the group rectangle, the real measurement is still dropped by the router, so the declared value can silently disagree with the DOM.
- Every future derived node type would need the same workaround or would reintroduce the hang.
- It keeps the wait coupled to React Flow's notion of "initialized" instead of the spec's.

### D2. Regression test in Playwright against a fixture page

The user asked for a test that does not mock `useNodesInitialized`. Under jsdom React Flow cannot measure, so the only faithful test is in the browser:

- Add a fixture route in `apps/web` next to the tour fixtures, rendering `WorkflowEditor` with `autoLayoutOnInit="after-measure"` and an initial graph that has groups. Two variants: one expanded group with members, and a graph whose every node is in collapsed groups.
- A new e2e spec opens each variant and asserts that the "Preparing measured layout" status disappears and the canvas content (a node, or the group card) is visible.
- Before the fix both cases time out on the overlay (RED); after it they pass.

Unit tests keep their existing `@xyflow/react` mock. The mock's `useNodesInitialized` entry and the `nodesInitializedMock` plumbing become unused after D1 and are removed. One unit test is added to `workflow-canvas.test.tsx` to pin the canvas-level contract: with a group present and all workflow nodes measured, `onMeasuredInitialAutoLayout` runs once and the overlay clears.

Alternative considered — a jsdom test with a fake `ResizeObserver` and stubbed element sizes driving the real React Flow. Rejected: it reimplements React Flow's measurement in the test and is brittle against library internals; the Playwright setup already exists in `apps/web`.

### D3. The settled layout clears the loader unless the canvas has unmounted

Found while implementing D1: the effect that starts the layout marks `initialLayoutAttemptedRef` and guards its promise with an effect-local `cancelled` flag. When the layout starts on mount (nothing to wait for, as in the all-collapsed case), React StrictMode in development runs the effect, cleans it up, and runs it again. The cleanup sets `cancelled`, the second run returns early because the layout was already attempted, and the settled promise is discarded, so `setInitialLayoutPending(false)` never runs. The same happens in production if any effect dependency changes while ELK is running.

Decision: the promise's settlement is tied to the component, not to one effect run. A ref tracks whether the canvas is mounted (set in a mount effect, cleared in its cleanup). On settle, if mounted, the canvas clears `initialLayoutPending` and, on success, schedules the fit. The effect-local `cancelled` flag is removed.

Alternative considered — reset `initialLayoutAttemptedRef` in the cleanup so the next run starts again. Rejected: the store's `measuredInitialAutoLayout` returns `true` at once on the second call while the first layout is still computing, so the second run would fit the viewport to the pre-layout positions and clear the loader before the layout is applied.

## Risks / Trade-offs

- [A layout that settles after its effect was cleaned up still updates the canvas] → Only while the canvas is mounted; the layout is attempted once per mount, so there is no newer run whose result it could overwrite.
- [The layout now starts without React Flow having measured the group frames] → The layout does not use frame sizes: `computeWorkflowAutoLayout` derives collapsed-group blocks from the card rectangle and refits expanded frames around members, both from group geometry.
- [A workflow node that never reports a size still hangs the overlay] → Accepted and out of scope by decision; unchanged from today.
- [`allNodesMeasured` reads measurements from store nodes, which lag one change cycle behind React Flow's internal lookup] → Same lag `nodesInitialized` had, since it also reads the `nodes` prop; no behavior change for graphs without groups.

## Migration Plan

None. The fix is internal to the canvas; hosts need no change. Rollback is reverting the commit.
