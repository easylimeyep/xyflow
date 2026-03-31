import { tv } from "tailwind-variants"

export const nodeShellStyles = tv({
  slots: {
    root: "relative",
    panel: "w-[260px] rounded-md border bg-card px-3 py-2 text-card-foreground",
    title: "mb-0.5 text-xs font-semibold",
    subtitle: "text-[11px] text-muted-foreground",
  },
  variants: {
    selected: {
      true: {
        panel: "border-2 border-ring shadow-md ring-2 ring-ring/40",
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
})
