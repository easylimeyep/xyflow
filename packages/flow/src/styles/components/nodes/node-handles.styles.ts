import { tv } from "tailwind-variants"

export const nodeHandlesStyles = tv({
  slots: {
    handleBase: "size-3",
  },
  variants: {
    kind: {
      target: {},
      outgoing: {
        handleBase: "origin-top-right transition-transform duration-300 hover:scale-150",
      },
    },
    isPending: {
      true: {
        handleBase: "bg-color-(--primary) border-(--primary)",
      },
    },
  },
  defaultVariants: {
    kind: "target",
    isPending: false,
  },
})
