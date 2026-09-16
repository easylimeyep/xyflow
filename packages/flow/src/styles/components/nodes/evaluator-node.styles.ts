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
    upstreamOperand:
      "flex h-8 min-w-0 items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground",
    upstreamOperandIcon: "size-3 shrink-0",
    upstreamOperandText: "truncate",
    // The shared tooltip is sized for a one-line caption; this one is a full
    // sentence, so it needs a readable line length and balanced wrapping.
    upstreamOperandTooltip:
      "max-w-[min(20rem,60vw)] text-center leading-relaxed text-pretty",
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
    label: "text-[11px] font-medium text-muted-foreground",
  },
})
