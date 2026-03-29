"use client"

import { Handle, Position } from "@xyflow/react"
import { ArrowRight, Plus } from "lucide-react"

import {
  selectPresentEdges,
  selectQuickAddPending,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"

interface OutputQuickAddAffordanceProps {
  nodeId: string
  sourceHandle?: string | null
  top?: string
  label?: string
  labelClassName?: string
}

export function OutputQuickAddAffordance({
  nodeId,
  sourceHandle = null,
  top = "50%",
  label,
  labelClassName,
}: OutputQuickAddAffordanceProps) {
  const normalizedHandle = sourceHandle ?? null
  const startQuickAddFromOutput = useWorkflowStore(
    (state: WorkflowStoreState) => state.startQuickAddFromOutput
  )
  const hasOutgoing = useWorkflowStore((state: WorkflowStoreState) =>
    selectPresentEdges(state).some(
      (edge) =>
        edge.source === nodeId && (edge.sourceHandle ?? null) === (normalizedHandle ?? null)
    )
  )
  const isPending = useWorkflowStore((state: WorkflowStoreState) => {
    const pending = selectQuickAddPending(state)
    return (
      pending?.sourceNodeId === nodeId &&
      (pending.sourceHandle ?? null) === (normalizedHandle ?? null)
    )
  })

  return (
    <div
      className="absolute -translate-y-1/2"
      style={{ top, right: 0 }}
      data-quick-add-active={isPending ? "true" : "false"}
    >
      {label ? (
        <div className={`pointer-events-none absolute -top-5 left-10 text-[10px] ${labelClassName ?? ""}`}>
          {label}
        </div>
      ) : null}
      <Handle
        id={normalizedHandle ?? undefined}
        type="source"
        position={Position.Right}
        style={
          isPending ? { borderColor: "hsl(var(--primary))", background: "hsl(var(--primary))" } : undefined
        }
      />
      {!hasOutgoing ? (
        <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <div className={`h-px w-10 ${isPending ? "bg-primary/60" : "bg-border"}`} />
          <ArrowRight
            className={`pointer-events-none size-3 ${isPending ? "text-primary" : "text-muted-foreground"}`}
          />
          <button
            type="button"
            className={`nodrag nopan inline-flex size-4 items-center justify-center rounded-sm border bg-background ${
              isPending ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
            aria-label={`Quick add from ${nodeId}${normalizedHandle ? `:${normalizedHandle}` : ""}`}
            onClick={(event) => {
              event.stopPropagation()
              startQuickAddFromOutput(nodeId, normalizedHandle)
            }}
          >
            <Plus className="size-3" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
