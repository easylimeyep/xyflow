import { tv } from "tailwind-variants"

export const workflowEdgeStyles = tv({
  slots: {
    toolbarContainer: "absolute z-20 transition-opacity",
    toolbar:
      "nodrag nopan inline-flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-sm",
    actionButton:
      "inline-flex size-6 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors",
    insertButton: "hover:bg-muted hover:text-foreground",
    deleteButton: "hover:bg-destructive/10 hover:text-destructive",
    actionIcon: "size-3.5",
  },
  variants: {
    showToolbar: {
      true: {
        toolbarContainer: "opacity-100",
      },
      false: {
        toolbarContainer: "opacity-0",
      },
    },
  },
  defaultVariants: {
    showToolbar: false,
  },
})
