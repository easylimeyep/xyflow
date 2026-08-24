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
    // Traversal stroke is applied as a className on BaseEdge (not inline style)
    // so the variant can override it — inline styles win over classes.
    edgePath: "[stroke:var(--border)] [stroke-width:2]",
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
    // An edge can be both traversed and active (e.g. inside a loop). `active`
    // is declared after `traversed`, so its stroke/width win when both apply.
    traversed: {
      true: {
        edgePath: "[stroke:var(--primary)] [stroke-width:2] opacity-70",
      },
    },
    active: {
      true: {
        edgePath: "[stroke:var(--primary)] [stroke-width:3] opacity-100",
      },
    },
  },
  defaultVariants: {
    showToolbar: false,
    traversed: false,
    active: false,
  },
})
