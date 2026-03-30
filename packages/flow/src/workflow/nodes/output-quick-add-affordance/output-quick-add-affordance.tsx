"use client"

import { Handle, Position } from "@xyflow/react"
import { Plus } from "lucide-react"
import { nodeHandlesStyles, outputQuickAddAffordanceStyles } from "../../../styles/components/nodes"

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

  const styles = outputQuickAddAffordanceStyles({ isPending })
  const handleStyles = nodeHandlesStyles({
    kind: "outgoing",
    isPending,
  })

  return (
    <div
      className={styles.container()}
      style={{ top, right: 0 }}
      data-quick-add-active={isPending ? "true" : "false"}
    >
      {label ? (
        <div className={styles.label({ class: labelClassName })}>
          {label}
        </div>
      ) : null}
      <Handle
        id={normalizedHandle ?? undefined}
        type="source"
        position={Position.Right}
        className={handleStyles.handleBase()}
      />
      {!hasOutgoing ? (
        <div className={styles.quickAddRoot()}>
          <div className={styles.quickAddLine()} />
          <button
            type="button"
            className={styles.quickAddButton()}
            aria-label={`Quick add from ${nodeId}${normalizedHandle ? `:${normalizedHandle}` : ""}`}
            onClick={(event) => {
              event.stopPropagation()
              startQuickAddFromOutput(nodeId, normalizedHandle)
            }}
          >
            <Plus className={styles.icon()} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
