import { tv } from "tailwind-variants"

export const editorToolbarStyles = tv({
  slots: {
    root: "flex flex-col items-center gap-2",
    bar: "inline-flex items-center gap-0.5 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur",
    separator: "mx-1 h-5 w-px shrink-0 bg-border",
    button: "text-muted-foreground",
    toggle:
      "size-8 px-0 text-muted-foreground data-selected:text-foreground [&_svg:not([class*='size-'])]:size-4",
    status:
      "flex items-center gap-2 rounded-md border bg-background/95 py-1 pr-1 pl-2.5 shadow-lg backdrop-blur",
    statusText: "text-xs",
  },
  variants: {
    placement: {
      // Pinned to the middle of the top edge of whatever positioned box holds
      // it — the canvas, when rendered inside `WorkflowEditor.Canvas`.
      floating: {
        root: "pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 *:pointer-events-auto",
      },
      inline: {},
    },
  },
  defaultVariants: {
    placement: "floating",
  },
})
