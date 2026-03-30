import { tv } from "tailwind-variants"

export const nodeShellStyles = tv({
  slots: {
    root: "relative",
    panel: "w-[260px] rounded-md border bg-white px-3 py-2 shadow-sm dark:bg-neutral-900",
    title: "mb-0.5 text-xs font-semibold",
    subtitle: "text-[11px] text-muted-foreground",
  },
  variants: {
    selected: {
      true: {
        panel:
          "border-2 border-black shadow-md ring-2 ring-black/40 dark:border-white dark:ring-white/50",
      },
    },
  },
  defaultVariants: {
    selected: false,
  },
})
