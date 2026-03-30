import { tv } from "tailwind-variants"

export const nodeConfigPanelStyles = tv({
  slots: {
    aside: "w-80 border-l bg-background p-3 rounded-lg",
    asideWithContent: "w-80 space-y-3 border-l bg-background p-3",
    heading: "text-sm font-semibold",
    emptyMessage: "mt-2 text-xs text-muted-foreground",
    fieldGroup: "space-y-1",
    label: "text-[11px] font-medium text-muted-foreground",
    description: "text-[11px] text-muted-foreground",
    booleanLabel: "inline-flex items-center gap-2 text-xs",
    selectTrigger: "w-full",
  },
})
