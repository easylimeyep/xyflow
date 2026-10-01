import { tv } from "tailwind-variants"

export const selectionToolbarStyles = tv({
  slots: {
    root: "nodrag nopan inline-flex items-center gap-0.5 rounded-md border bg-background/95 p-0.5 shadow-sm",
    separator: "mx-0.5 h-4 w-px shrink-0 bg-border",
    button: "",
  },
  variants: {
    // The destructive Button variant brings its own color; only the neutral
    // buttons are toned down.
    destructive: {
      false: {
        button: "text-muted-foreground",
      },
    },
  },
  defaultVariants: {
    destructive: false,
  },
})
