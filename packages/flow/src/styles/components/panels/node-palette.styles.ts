import { tv } from "tailwind-variants"

export const nodePaletteStyles = tv({
  slots: {
    aside: [
      "space-y-2 bg-background p-3 outline-none rounded-lg border",
      "transition-all duration-200 ease-in-out",
      "data-[state=closed]:pointer-events-none",
    ],
    heading: "text-sm font-semibold",
    list: "flex flex-col gap-2",
    card: "rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted",
    cardButton: "align-center flex w-full gap-2",
    iconWrap: "flex items-center justify-center",
    icon: "size-4 text-muted-foreground",
    textWrap: "flex flex-col items-start gap-1",
    title: "text-lg font-medium",
    description: "text-left text-xs text-muted-foreground",
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
  defaultVariants: {
    quickAddActive: false,
    placement: "floating",
  },
})
