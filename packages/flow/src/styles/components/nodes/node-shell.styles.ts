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
    statusBadge:
      "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize leading-none",
    statusDot: "size-1.5 rounded-full",
    iterationBadge:
      "inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground tabular-nums",
    errorText:
      "mt-1 max-w-full truncate text-[11px] leading-tight text-destructive",
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
    status: {
      none: {},
      done: {
        panel: "border-emerald-500/60 ring-1 ring-emerald-500/30",
        statusBadge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
        statusDot: "bg-emerald-500",
      },
      running: {
        panel: "border-sky-500/70 shadow-sm ring-2 ring-sky-500/40",
        statusBadge: "border-sky-500/40 bg-sky-500/10 text-sky-600",
        statusDot: "animate-pulse bg-sky-500",
      },
      waiting: {
        panel: "border-amber-500/50 ring-1 ring-amber-500/25",
        statusBadge: "border-amber-500/40 bg-amber-500/10 text-amber-600",
        statusDot: "bg-amber-500",
      },
      failed: {
        panel: "border-destructive shadow-sm ring-2 ring-destructive/35",
        statusBadge: "border-destructive/40 bg-destructive/10 text-destructive",
        statusDot: "bg-destructive",
      },
      skipped: {
        panel: "border-dashed border-muted-foreground/40 opacity-60",
        statusBadge:
          "border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground line-through",
        statusDot: "bg-muted-foreground/50",
      },
    },
    // Declared after the others so its ring wins over the selection ring:
    // while searching, "which node am I on" is the question being asked.
    searchState: {
      none: {},
      match: {
        panel: "ring-2 ring-amber-400/60",
      },
      current: {
        panel: "shadow-lg ring-[3px] ring-primary",
      },
    },
    // The strong mark belongs to the field the search is on; the node holding
    // it then only needs an outline to stand apart at low zoom.
    currentField: {
      true: {},
    },
  },
  compoundVariants: [
    {
      searchState: "current",
      currentField: true,
      class: {
        panel: "shadow-md ring-2 ring-primary/60",
      },
    },
  ],
  defaultVariants: {
    selected: false,
    validation: false,
    status: "none",
    searchState: "none",
    currentField: false,
  },
})
