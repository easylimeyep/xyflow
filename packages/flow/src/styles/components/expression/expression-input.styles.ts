import { tv } from "tailwind-variants"

export const expressionInputStyles = tv({
  slots: {
    root: "space-y-1",
    editorContainer: "overflow-hidden rounded-md border border-input bg-background",
    popoverContent: "w-96 p-0",
    commandItemContent: "flex min-w-0 flex-col",
    commandItemLabel: "truncate font-mono text-[11px]",
    commandItemDescription: "truncate text-[10px] text-muted-foreground",
  },
})
