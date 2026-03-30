import { tv } from "tailwind-variants"

export const editorToolbarStyles = tv({
  slots: {
    root: "space-y-2 border-b bg-background p-3 rounded-lg",
    actions: "flex flex-wrap items-center gap-2",
    importPanel: "space-y-2",
    status: "flex items-center justify-between rounded-md border px-2 py-1",
    statusText: "text-xs",
  },
})
