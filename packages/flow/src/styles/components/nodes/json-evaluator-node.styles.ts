import { tv } from "tailwind-variants"

import { nodeControlStyles } from "./node-control.styles"

export const jsonEvaluatorNodeStyles = tv({
  slots: {
    matchTypeField: "space-y-1 pt-1",
    matchTypeLabel: "text-[11px] font-medium text-muted-foreground",
    matchTypeSelect: ["w-full text-[11px]", nodeControlStyles()],
  },
})
