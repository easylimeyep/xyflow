import { tv } from "tailwind-variants"

export const nodeShellStyles = tv({
  slots: {
    root: "relative",
    panel: "w-[260px] rounded-md border bg-card px-3 py-2 text-card-foreground",
    header: "mb-0.5 flex items-center justify-between gap-2",
    title: "text-xs font-semibold",
    subtitle: "text-[11px] text-muted-foreground",
    headerAccessory: "nodrag nopan shrink-0",
  },
  variants: {
    selected: {
      true: {
        panel: "shadow-md ring-2 ring-ring/40",
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
})
