import { tv } from "tailwind-variants"

export const inlineExpressionNodeStyles = tv({
  slots: {
    editField: "nodrag nopan mt-2 space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    helperText: "mt-1 text-[10px] text-muted-foreground",
  },
})
