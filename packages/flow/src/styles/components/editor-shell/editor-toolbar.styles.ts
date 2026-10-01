import { tv } from "tailwind-variants"

export const editorToolbarStyles = tv({
  slots: {
    root: "flex flex-col items-center gap-2",
    // `box-content`: the animated width and height are the measured content's
    // own, with the border added outside them. `overflow-clip` rather than
    // `-hidden`: a clipped box is no scroll container, so focusing the search
    // input while the bar is still narrow cannot scroll the content sideways.
    bar: "box-content overflow-clip rounded-lg border bg-background/95 shadow-lg backdrop-blur",
    // Sized by its content alone, never by the bar animating around it.
    content: "w-max",
    actions: "flex items-center gap-0.5 p-1",
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
      // Centred by auto margins rather than a -50% translate, which would land
      // the animating bar on half pixels and make it shimmer sideways.
      floating: {
        root: "pointer-events-none absolute inset-x-0 top-3 z-20 mx-auto w-fit *:pointer-events-auto",
      },
      inline: {},
    },
    searchOpen: {
      true: {
        bar: "focus-within:border-ring/60",
      },
    },
  },
  defaultVariants: {
    placement: "floating",
    searchOpen: false,
  },
})
