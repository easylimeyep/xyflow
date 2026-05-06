import { tv } from "tailwind-variants"

export const workflowCanvasStyles = tv({
  slots: {
    root: "relative h-full w-full",
    flow: "h-full w-full transition-opacity",
    initializingOverlay:
      "absolute inset-0 z-30 flex items-center justify-center bg-background/80 text-sm font-medium text-muted-foreground backdrop-blur-sm",
  },
  variants: {
    initializing: {
      true: {
        flow: "pointer-events-none opacity-0",
      },
      false: {
        flow: "opacity-100",
      },
    },
  },
  defaultVariants: {
    initializing: false,
  },
})
