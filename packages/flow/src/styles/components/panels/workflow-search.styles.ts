import { tv } from "tailwind-variants"

export const workflowSearchStyles = tv({
  slots: {
    root: [
      "flex flex-col overflow-hidden rounded-md border bg-background/95 shadow-lg backdrop-blur",
      "focus-within:border-ring/60",
    ],
    bar: "flex items-center gap-1 p-1",
    icon: "ml-1 size-3.5 shrink-0 text-muted-foreground",
    input:
      "h-7 min-w-0 flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
    option:
      "font-mono text-[11px] text-muted-foreground aria-pressed:text-foreground",
    counter: [
      "relative h-6 min-w-14 shrink-0 justify-end px-1 font-mono text-[11px] tabular-nums text-muted-foreground",
      "aria-expanded:bg-muted aria-expanded:text-foreground",
    ],
    filterDot: "absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary",
    liveRegion: "sr-only",
    divider: "mx-0.5 h-4 w-px shrink-0 bg-border",
  },
  variants: {
    placement: {
      floating: {
        root: "absolute right-14 top-3 z-30 w-[min(440px,calc(100%-5rem))]",
      },
      inline: {
        root: "w-full",
      },
    },
    empty: {
      true: {
        counter: "text-destructive",
      },
    },
    besidePalette: {
      true: {},
    },
  },
  compoundVariants: [
    {
      // Clear the open floating palette (w-72 plus its m-4) when the canvas
      // is wide enough to hold both; a narrower canvas keeps the bar in the
      // corner, over the palette's heading, rather than squeezing it.
      placement: "floating",
      besidePalette: true,
      class: {
        root: "@2xl:right-[19.5rem] @2xl:w-[min(440px,calc(100%-21rem))]",
      },
    },
  ],
  defaultVariants: {
    placement: "floating",
    empty: false,
    besidePalette: false,
  },
})

/** Fixed row sizes, so the virtualized list can lay out without measuring. */
export const SEARCH_RESULT_ROW_SIZE = 28
export const SEARCH_RESULT_HEADING_SIZE = 30

export const searchResultsPanelStyles = tv({
  slots: {
    panel: "flex flex-col border-t",
    filters: "flex items-center gap-1 px-2 py-1.5",
    filterItem: [
      "h-6 gap-1 px-2 text-[11px] text-muted-foreground",
      "data-selected:text-foreground",
    ],
    filterCount: "font-mono tabular-nums opacity-70",
    list: "max-h-[min(45vh,420px)] min-h-0 px-1 pb-1",
    groupHeader: [
      "flex h-[30px] items-center gap-1.5 px-1.5 text-[11px] text-foreground",
    ],
    groupIcon: "size-3.5 shrink-0 text-muted-foreground",
    groupLabel: "min-w-0 truncate font-medium",
    groupKind: "shrink-0 text-muted-foreground",
    groupCount:
      "ml-auto shrink-0 rounded-sm bg-muted px-1 font-mono text-[10px] tabular-nums text-muted-foreground",
    row: [
      "h-7 gap-2 pl-5 text-[11px]",
      "data-selected:bg-primary/10 data-selected:text-foreground",
      "data-focused:bg-accent",
    ],
    rowIndex:
      "w-7 shrink-0 text-right font-mono tabular-nums text-muted-foreground",
    rowField: "w-40 shrink-0 truncate text-muted-foreground",
    snippet: "min-w-0 flex-1 truncate font-mono",
    hit: "rounded-[2px] bg-amber-300/60 text-foreground dark:bg-amber-400/40",
    emptyState: [
      "flex flex-wrap items-center gap-2 px-3 py-3 text-[11px] text-muted-foreground",
    ],
  },
})
