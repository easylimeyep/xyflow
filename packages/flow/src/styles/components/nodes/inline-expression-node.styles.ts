import { tv } from "tailwind-variants"

export const inlineExpressionNodeStyles = tv({
  slots: {
    rootToggleWrap: "inline-flex items-center gap-1.5",
    rootToggleLabel: "text-[11px] font-medium text-muted-foreground",
    rootToggle: "size-3.5 rounded-[3px]",
    editField: "nodrag nopan mt-2 space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    helperText: "mt-1 text-[10px] text-muted-foreground",
    tokenList: "space-y-2",
    tokenRow: "group/token-row relative",
    tokenRowMain: "flex items-start gap-2",
    tokenRowInput: "min-w-0 flex-1",
    tokenAddButton: "shrink-0 self-start",
    tokenDeleteBadge:
      "pointer-events-none absolute -top-2 -right-2 z-10 opacity-0 transition-opacity duration-150 group-hover/token-row:opacity-100 group-focus-within/token-row:opacity-100",
    tokenDeleteButton: "pointer-events-auto",
  },
})
