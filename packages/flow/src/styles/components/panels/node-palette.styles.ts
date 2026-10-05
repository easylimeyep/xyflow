import { tv } from "tailwind-variants"

export const nodePaletteStyles = tv({
  slots: {
    aside: [
      // A column whose list takes the remaining height and scrolls, so a long
      // registry stays inside the aside's frame instead of spilling past it.
      "flex min-h-0 flex-col gap-2 bg-background p-3 outline-none rounded-lg border",
      "transition-all duration-200 ease-in-out",
      "data-[state=closed]:pointer-events-none",
    ],
    heading: "shrink-0 text-sm font-semibold",
    list: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain",
    card: "rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted",
    cardButton: "align-center flex w-full gap-2",
    iconWrap: "flex items-center justify-center",
    icon: "size-4 text-muted-foreground",
    textWrap: "flex flex-col items-start gap-1",
    title: "text-lg font-medium",
    description: "text-left text-xs text-muted-foreground",
    // The drag ghost. It stays rendered but parked above the viewport, since a
    // browser only rasterizes rendered elements; `fixed` gives it its own paint
    // layer so nothing around it (the list's scrollbar) is captured with it.
    // No transform for parking — it can shift where the browser samples.
    preview: [
      "pointer-events-none fixed -top-[1000px] left-0 flex w-48 items-center gap-2",
      "rounded-md border bg-background px-3 py-2 shadow-sm",
    ],
    previewIcon: "size-4 shrink-0 text-muted-foreground",
    previewTitle: "truncate text-sm font-medium",
  },
  variants: {
    quickAddActive: {
      true: {
        aside: "ring-2 ring-primary/60 ring-inset",
      },
    },
    placement: {
      floating: {
        aside: [
          "w-72 absolute z-10 top-0 bottom-0 right-0 m-4 shadow-sm",
          "data-[state=open]:translate-x-0 data-[state=open]:opacity-100",
          "data-[state=closed]:translate-x-[calc(100%-1rem)] data-[state=closed]:opacity-0",
        ],
      },
      inline: {},
    },
  },
  compoundVariants: [
    {
      // A quick-add borrows the floating palette without moving the floating
      // search (z-30) out of its way, so the palette covers it while picking.
      placement: "floating",
      quickAddActive: true,
      class: { aside: "z-40" },
    },
  ],
  defaultVariants: {
    quickAddActive: false,
    placement: "floating",
  },
})
