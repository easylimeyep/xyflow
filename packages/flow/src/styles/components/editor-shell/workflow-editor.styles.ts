import { tv } from "tailwind-variants"

export const workflowEditorStyles = tv({
  slots: {
    root: "flex h-full w-full flex-1 flex-col overflow-hidden rounded-md",
    content:
      "flex min-h-0 flex-1 relative border border-grey-400 rounded-md overflow-hidden",
    canvasWrap: "relative min-h-0 flex-1",
    canvasOverlay: "absolute right-3 top-3 z-20",
    canvasToolbar:
      "rounded-md border bg-background/95 p-1 shadow-lg backdrop-blur",
  },
})
