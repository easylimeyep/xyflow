import { tv } from "tailwind-variants"

export const nodeShellStyles = tv({
  slots: {
    root: "relative",
    panel: "w-[260px] rounded-md border bg-card px-3 py-2 text-card-foreground",
    header: "mb-0.5 flex items-center justify-between gap-2",
    title: "text-xs font-semibold",
    subtitle: "text-[11px] text-muted-foreground",
    headerActions: "nodrag nopan flex shrink-0 items-center gap-1",
    headerAccessory: "shrink-0",
    validationButton:
      "inline-flex h-5 w-5 items-center justify-center rounded-sm text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
    validationTooltip: "max-w-72 items-start text-left",
    validationList: "space-y-1",
  },
  variants: {
    selected: {
      true: {
        panel: "shadow-md ring-2 ring-ring/40",
      },
    },
    validation: {
      true: {
        panel: "border-destructive shadow-sm ring-2 ring-destructive/25",
      },
    },
  },
  defaultVariants: {
    selected: false,
    validation: false,
  },
})
