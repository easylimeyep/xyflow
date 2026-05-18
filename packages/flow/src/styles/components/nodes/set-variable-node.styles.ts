import { tv } from "tailwind-variants"

export const setVariableNodeStyles = tv({
  slots: {
    root: "nodrag nopan mt-2 space-y-2",
    fieldGroup: "space-y-1",
    labelTypeRow: "grid grid-cols-[minmax(0,1fr)_2rem] items-start gap-2",
    labelTypeField: "min-w-0 space-y-1",
    labelTypeSelectField: "w-8 space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    errorText: "text-[11px] text-destructive",
    inlineEditField: "space-y-1",
  },
})
