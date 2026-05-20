# Design

## Problem Shape

The current hover rerender path is:

```text
pointer move over React Flow
  -> WorkflowCanvas converts screen coordinates to flow coordinates
  -> WorkflowEditor passes setLastPointerPosition
  -> workflow store writes lastPointerFlowPosition
  -> all workflow store subscribers are notified
  -> node selectors re-run
  -> selectors that allocate [] or filtered arrays appear changed by reference
  -> whole custom node components rerender
```

This makes pointer movement a global reactive update even though no graph, selection, validation, or history state changed.

## State Boundary

Treat the latest pointer flow position as transient UI data rather than workflow state.

The workflow store should continue to own:

- nodes and edges
- selection
- history
- validation
- runtime config
- quick-add and edge-insert pending state
- graph mutations and clipboard import/export effects

The editor UI should own:

- latest pointer flow position for paste placement
- the imperative handoff from canvas pointer movement to paste hotkeys

## Pointer Position Holder

Create an editor-level non-reactive holder, preferably a `useRef<XYPosition | null>`, in the workflow editor composition layer.

Expose it to both canvas and hotkey handling through a small context or local callback wiring:

```text
WorkflowEditorRoot
  creates lastPointerFlowPositionRef
  provides read/write helpers through editor context

WorkflowCanvas
  onMouseMove writes lastPointerFlowPositionRef.current

WorkflowEditorLayoutProvider / paste hotkey
  reads lastPointerFlowPositionRef.current when Ctrl+V is handled
```

Updating the ref must not call React state setters or Zustand setters. It should not trigger renders.

## Clipboard Paste API

Change the workflow store paste action from reading pointer state internally to accepting an optional anchor:

```ts
pasteFromClipboard(anchor?: XYPosition | null): Promise<boolean>
```

Inside the paste action:

```ts
const anchor = explicitAnchor ?? getFallbackPasteAnchor(currentGraph.viewport)
```

This keeps paste placement deterministic and makes the transient coordinate dependency explicit at the call site.

## Canvas Pointer Handling

`WorkflowCanvas` may continue to batch pointer calculations with `requestAnimationFrame`, but the flush should write only to the non-reactive holder. If the ref write is cheap enough, the implementation can also simplify the handler, as long as tests cover render stability.

The key invariant is:

```text
pointer move
  -> no workflow store write
  -> no graph subscriber notification
```

## Selector Stability Follow-up

This change removes the high-frequency trigger. It does not need to solve every selector reference issue. However, existing selectors that return new empty arrays or filtered arrays remain worth stabilizing in a separate change because any unrelated store update can still make node components rerender.

## Tests

Add or update tests for:

- `pasteFromClipboard(anchor)` places pasted nodes at the supplied anchor.
- `pasteFromClipboard(null)` or omitted anchor uses the viewport fallback.
- pointer movement over `WorkflowCanvas` updates the non-reactive holder without calling workflow store pointer actions.
- pointer movement does not rerender node components when graph data is unchanged.
- non-canvas render budget remains stable during pointer movement.

## Risks

- Paste hotkeys currently live above the canvas component, so the pointer ref must be available at that level. Mitigation: create the ref in the editor root/layout context rather than inside canvas only.
- Tests may currently assert `setLastPointerPosition` behavior. Mitigation: rewrite them around user-visible paste anchoring and render budget, not the removed store action.
- If pointer position is only tracked while the pointer is over the canvas, paste from outside the canvas may use an older anchor. Mitigation: clear or update the ref on pointer leave if stale placement is undesirable, or intentionally keep the last canvas position as the current behavior effectively does.
