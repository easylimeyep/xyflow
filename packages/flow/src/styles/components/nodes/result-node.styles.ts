import { tv } from "tailwind-variants"

import { nodeControlStyles } from "./node-control.styles"

export const resultNodeStyles = tv({
  slots: {
    root: "mt-2",
    fieldGroup: "space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    control: nodeControlStyles(),
  },
})
