import { tv } from "tailwind-variants"

import { nodeControlStyles } from "./node-control.styles"

export const setVariableNodeStyles = tv({
  slots: {
    // Labels and spacing drag the node; only the controls opt out.
    root: "mt-2 space-y-2",
    control: nodeControlStyles(),
    fieldGroup: "space-y-1",
    labelTypeRow: "grid grid-cols-[minmax(0,1fr)_2rem] items-start gap-2",
    labelTypeField: "min-w-0 space-y-1",
    labelTypeSelectField: "w-8 space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    errorText: "text-[11px] text-destructive",
    inlineEditField: "space-y-1",
  },
})
