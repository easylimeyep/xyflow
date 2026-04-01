import { tv } from "tailwind-variants"

export const outputQuickAddAffordanceStyles = tv({
  slots: {
    container: "absolute -translate-y-1/2",
    label:
      "pointer-events-none absolute top-0 -translate-y-1/2 left-5 text-[10px] bg-muted z-10",
    quickAddRoot:
      "absolute top-0.25 left-1.5 flex -translate-y-1/2 items-center",
    quickAddLine: "h-[2px] w-10 bg-border",
    quickAddButton: "",
    icon: "",
  },
  variants: {
    isPending: {
      true: {
        quickAddLine: "bg-primary/60",
      },
    },
  },
  defaultVariants: {
    isPending: false,
  },
})
