import { tv } from "tailwind-variants"

export const setVariableNodeStyles = tv({
  slots: {
    root: "nodrag nopan mt-2 space-y-2",
    fieldGroup: "space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    errorText: "text-[11px] text-destructive",
    inlineEditField: "space-y-1",
  },
})
