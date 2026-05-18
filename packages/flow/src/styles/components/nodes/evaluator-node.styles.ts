import { tv } from "tailwind-variants"

export const evaluatorNodeStyles = tv({
  slots: {
    root: "nodrag nopan mt-2 space-y-1",
    conditionList: "space-y-1",
    conditionRow: "group/condition relative flex items-start gap-1",
    leftControls:
      "flex flex-col items-center gap-0.5 pt-1 opacity-0 transition-opacity group-hover/condition:opacity-100",
    dragHandle:
      "flex h-5 w-5 cursor-grab items-center justify-center rounded text-muted-foreground hover:text-foreground active:cursor-grabbing",
    conditionBody: "min-w-0 flex-1 space-y-1",
    operandRow: "flex items-start gap-1",
    operandEditor: "min-w-0 flex-1 space-y-1",
    operandTypeSelect: "shrink-0",
    operandArrayTrigger: "min-w-0 w-full justify-between overflow-hidden px-2",
    operandArrayTriggerLabel: "min-w-0 truncate text-muted-foreground",
    operandArrayPreviewList: "flex min-w-0 flex-1 items-center gap-1 overflow-hidden",
    operandArrayPreviewChip: "h-4 max-w-[4.5rem] min-w-0 px-1.5 text-[0.625rem]",
    operandArrayPreviewChipText: "min-w-0 truncate",
    operandArrayOverflowBadge: "h-4 shrink-0 px-1.5 text-[0.625rem]",
    operandArrayPopover: "w-56 gap-1 p-2",
    operandArrayList: "space-y-1",
    operandArrayRow: "group/operand-row relative flex items-center gap-1",
    operandArrayInput: "min-w-0 flex-1",
    operandArrayDeleteButton:
      "flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive",
    operatorRow: "flex items-center gap-1",
    operatorSelect: "w-full text-[11px]",
    deleteButton:
      "flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/condition:opacity-100",
    logicalOperatorSeparator: "flex items-center justify-center py-0.5",
    logicalOperatorSelect: "w-16 text-[10px]",
    logicalOperatorBadge:
      "rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
    optionToggleWrap: "inline-flex items-center gap-1.5 pt-1",
    optionToggle: "size-3.5 rounded-[3px]",
    optionToggleLabel: "text-[11px] font-medium text-muted-foreground",
    addButton: "mt-1 h-7 w-full text-[11px]",
    operandAddButton: "h-7 w-full text-[11px]",
    label: "text-[11px] font-medium text-muted-foreground",
  },
})
