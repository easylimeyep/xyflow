"use client"

import { Handle, Position } from "@xyflow/react"
import { Plus } from "lucide-react"

import {
  selectPresentEdges,
  selectQuickAddPending,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import { tv } from "tailwind-variants"

interface OutputQuickAddAffordanceProps {
  nodeId: string
  sourceHandle?: string | null
  top?: string
  label?: string
  labelClassName?: string
}

const outgoingClasses = tv({
  slots: {
    root: "absolute top-1/2 left-1 flex -translate-y-1/2 items-center",
    line: ["h-px w-10 bg-gray-400"],
    button: ["size-4 rounded-sm border bg-background"],
    outgoing:
      "transition-transform duration-300 hover:scale-150 size-3 origin-top-right",
  },
  variants: {
    isPending: {
      true: {
        line: "bg-primary/60",
        outgoing: "bg-color-(--primary) border-(--primary)",
      },
    },
  },
})

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
        edge.source === nodeId &&
        (edge.sourceHandle ?? null) === (normalizedHandle ?? null)
    )
  )
  const isPending = useWorkflowStore((state: WorkflowStoreState) => {
    const pending = selectQuickAddPending(state)
    return (
      pending?.sourceNodeId === nodeId &&
      (pending.sourceHandle ?? null) === (normalizedHandle ?? null)
    )
  })

  const outgoingStyles = outgoingClasses({ isPending })

  return (
    <div
      className="absolute -translate-y-1/2"
      style={{ top, right: 0 }}
      data-quick-add-active={isPending ? "true" : "false"}
    >
      {label ? (
        <div
          className={`pointer-events-none absolute -top-5 left-10 text-[10px] ${labelClassName ?? ""}`}
        >
          {label}
        </div>
      ) : null}
      <Handle
        id={normalizedHandle ?? undefined}
        type="source"
        position={Position.Right}
        className={outgoingStyles.outgoing()}
      />
      {!hasOutgoing ? (
        <div className={outgoingStyles.root()}>
          <div className={outgoingStyles.line()} />
          <button
            type="button"
            className={outgoingStyles.button()}
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
