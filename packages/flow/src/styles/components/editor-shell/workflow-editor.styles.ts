import { tv } from "tailwind-variants"

export const workflowEditorStyles = tv({
  slots: {
    root: "flex h-full w-full flex-1 flex-col overflow-hidden rounded-md",
    content: "flex min-h-0 flex-1",
    canvasWrap: "min-h-0 flex-1",
  },
})
