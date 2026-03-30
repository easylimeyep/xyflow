import { tv } from "tailwind-variants"

export const outputQuickAddAffordanceStyles = tv({
  slots: {
    container: "absolute -translate-y-1/2",
    label: "pointer-events-none absolute -top-5 left-10 text-[10px]",
    quickAddRoot: "absolute top-1/2 left-1 flex -translate-y-1/2 items-center",
    quickAddLine: "h-px w-10 bg-gray-400",
    quickAddButton: "size-4 rounded-sm border bg-background",
    icon: "size-3",
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
