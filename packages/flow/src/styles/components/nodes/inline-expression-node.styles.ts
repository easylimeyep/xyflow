import { tv } from "tailwind-variants"

import { nodeControlStyles } from "./node-control.styles"

export const inlineExpressionNodeStyles = tv({
  slots: {
    rootToggleWrap: "inline-flex items-center gap-1.5 mr-2",
    rootToggleLabel: "text-[11px] font-medium text-muted-foreground",
    rootToggle: ["size-3.5 rounded-[3px]", nodeControlStyles()],
    // Labels and spacing drag the node; only the controls opt out.
    editField: "mt-2 space-y-1",
    fieldHeader: "flex items-center justify-between gap-2",
    label: "text-[11px] font-medium text-muted-foreground",
    helperText: "mt-1 text-[10px] text-muted-foreground",
    tokenList: "space-y-2",
    tokenRow: "group/token-row relative",
    tokenRowInput: "min-w-0 flex-1",
    tokenRowError: "mt-1 text-[10px] text-destructive",
    tokenAddRow: "",
    tokenAddButton: [
      "text-muted-foreground hover:text-foreground w-full",
      nodeControlStyles(),
    ],
    tokenDeleteButton: [
      nodeControlStyles(),
      "pointer-events-auto absolute -top-2 -left-2 z-10 opacity-0 shadow-sm transition-opacity duration-150 group-hover/token-row:opacity-100",
      "group-focus-within/token-row:opacity-100 hover:text-destructive focus-visible:text-destructive",
      "rounded-full",
    ],
  },
})
