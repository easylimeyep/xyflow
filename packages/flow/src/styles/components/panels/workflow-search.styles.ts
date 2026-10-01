import { tv } from "tailwind-variants"

/** Where a floating search bar sits over the canvas. */
export type WorkflowSearchPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

const RIGHT_POSITIONS: WorkflowSearchPosition[] = [
  "top-right",
  "center-right",
  "bottom-right",
]

const floatingPosition = (position: WorkflowSearchPosition, root: string) => ({
  placement: "floating" as const,
  position,
  class: { root },
})

export const workflowSearchStyles = tv({
  slots: {
    root: [
      "flex flex-col divide-y overflow-hidden rounded-md border bg-background/95 shadow-lg backdrop-blur",
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
        root: "absolute z-30 w-[min(440px,calc(100%-5rem))]",
      },
      inline: {
        root: "w-full",
      },
      // Rendered inside the editor toolbar, which supplies the surface.
      toolbar: {
        root: "w-[min(440px,calc(100cqw-2rem))] rounded-none border-0 bg-transparent shadow-none backdrop-blur-none",
      },
    },
    empty: {
      true: {
        counter: "text-destructive",
      },
    },
    position: {
      "top-left": {},
      "top-center": {},
      "top-right": {},
      "center-left": {},
      "center-right": {},
      "bottom-left": {},
      "bottom-center": {},
      "bottom-right": {},
    },
    besidePalette: {
      true: {},
    },
    belowToolbar: {
      true: {},
    },
  },
  compoundVariants: [
    floatingPosition("top-left", "top-3 left-3"),
    floatingPosition("top-center", "top-3 left-1/2 -translate-x-1/2"),
    // Clears the palette toggle pinned in the top-right corner.
    floatingPosition("top-right", "top-3 right-14"),
    // The whole block is centred, results included, so an open panel grows
    // both ways and stays on the canvas instead of running off its bottom.
    floatingPosition("center-left", "top-1/2 -translate-y-1/2 left-3"),
    floatingPosition("center-right", "top-1/2 -translate-y-1/2 right-3"),
    // Beside the minimap and the zoom controls stacked in that corner.
    floatingPosition(
      "bottom-left",
      "bottom-3 left-[15rem] w-[min(440px,calc(100%-17rem))]"
    ),
    // Centred, but never so far left that it reaches over the minimap and the
    // zoom controls in the bottom-left corner.
    floatingPosition(
      "bottom-center",
      "bottom-3 left-[max(calc(15rem+220px),50%)] -translate-x-1/2"
    ),
    floatingPosition("bottom-right", "bottom-3 right-3"),
    {
      // Along the bottom edge the results open upwards, keeping the bar on
      // the edge it was pinned to.
      placement: "floating",
      position: ["bottom-left", "bottom-center", "bottom-right"],
      class: { root: "flex-col-reverse divide-y-reverse" },
    },
    {
      // Clear the open floating palette (w-72 plus its m-4) when the canvas
      // is wide enough to hold both; a narrower canvas keeps the bar in the
      // corner, over the palette's heading, rather than squeezing it.
      placement: "floating",
      position: RIGHT_POSITIONS,
      besidePalette: true,
      class: {
        root: "@2xl:right-[19.5rem] @2xl:w-[min(440px,calc(100%-21rem))]",
      },
    },
    {
      // Centred bars centre on the canvas left of the open palette instead.
      placement: "floating",
      position: "top-center",
      besidePalette: true,
      class: {
        root: "@2xl:left-[calc((100%-19.5rem)/2)] @2xl:w-[min(440px,calc(100%-21rem))]",
      },
    },
    {
      placement: "floating",
      position: "bottom-center",
      besidePalette: true,
      class: {
        root: "@2xl:left-[max(calc(15rem+220px),calc((100%-19.5rem)/2))] @2xl:w-[min(440px,calc(100%-21rem))]",
      },
    },
    {
      // The floating editor toolbar holds the middle of the top edge, so bars
      // pinned to that edge open below it rather than over it.
      placement: "floating",
      position: ["top-left", "top-center", "top-right"],
      belowToolbar: true,
      class: { root: "top-16" },
    },
  ],
  defaultVariants: {
    placement: "floating",
    position: "top-right",
    empty: false,
    besidePalette: false,
    belowToolbar: false,
  },
})

/** Fixed row sizes, so the virtualized list can lay out without measuring. */
export const SEARCH_RESULT_ROW_SIZE = 28
export const SEARCH_RESULT_HEADING_SIZE = 30

export const searchResultsPanelStyles = tv({
  slots: {
    panel: "flex flex-col",
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
