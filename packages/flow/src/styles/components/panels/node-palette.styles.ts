import { tv } from "tailwind-variants"

export const nodePaletteStyles = tv({
  slots: {
    aside: "relative w-72 space-y-2 border-r bg-background p-3 outline-none",
    quickAddHint:
      "rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary",
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
  },
  defaultVariants: {
    quickAddActive: false,
  },
})
