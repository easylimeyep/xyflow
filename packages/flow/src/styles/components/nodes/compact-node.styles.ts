import { tv } from "tailwind-variants"

export const compactNodeStyles = tv({
  slots: {
    root: "relative",
    // The title is drawn large on purpose: this card only shows up when the
    // canvas is zoomed far out, where the full node's 12px text is unreadable.
    panel:
      "flex size-full items-center justify-center overflow-hidden rounded-md border bg-card px-4 text-card-foreground",
    title: "line-clamp-2 text-center text-2xl font-semibold break-words",
    output: "absolute -translate-y-1/2",
  },
  variants: {
    selected: {
      true: { panel: "shadow-md ring-4 ring-ring/40" },
    },
    validation: {
      true: { panel: "border-destructive ring-4 ring-destructive/25" },
    },
    // Declared last so a search mark wins over the selection ring, as on the
    // full node.
    searchState: {
      none: {},
      match: { panel: "ring-4 ring-amber-400/60" },
      current: { panel: "shadow-lg ring-[6px] ring-primary" },
    },
  },
  defaultVariants: {
    selected: false,
    validation: false,
    searchState: "none",
  },
})
