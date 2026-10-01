import { tv } from "tailwind-variants"

export const workflowEditorStyles = tv({
  slots: {
    // Focusable only so clicks keep focus inside the editor; never a tab stop
    // and never outlined.
    root: "relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-md outline-none",
    // Starts below the floating toolbar, which holds the top edge.
    validationAlertWrap:
      "pointer-events-none absolute left-1/2 top-16 z-20 w-[min(520px,calc(100%-6rem))] -translate-x-1/2",
    validationAlert: "pointer-events-auto shadow-lg",
    content:
      "flex min-h-0 flex-1 relative border border-grey-400 rounded-md overflow-hidden",
    // A size container, so parts floating over the canvas can respond to the
    // canvas's own width rather than the viewport's.
    canvasWrap: "@container relative min-h-0 flex-1",
    canvasOverlay: "absolute right-3 top-3 z-20",
    canvasToolbar:
      "rounded-md border bg-background/95 p-1 shadow-lg backdrop-blur",
  },
})
