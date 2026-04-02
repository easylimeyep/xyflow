"use client"

import { Handle, Position } from "@xyflow/react"
import { Plus, PlusIcon } from "lucide-react"
import {
  nodeHandlesStyles,
  outputQuickAddAffordanceStyles,
} from "../../../styles/components/nodes"

import {
  selectPresentEdges,
  selectQuickAddPending,
  useWorkflowShallowStore,
  type WorkflowStoreState,
} from "../../store"
import { Button } from "@workspace/ui/components/button"

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
  const { startQuickAddFromOutput, hasOutgoing, isPending } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      startQuickAddFromOutput: state.startQuickAddFromOutput,
      hasOutgoing: selectPresentEdges(state).some(
        (edge) =>
          edge.source === nodeId &&
          (edge.sourceHandle ?? null) === normalizedHandle
      ),
      isPending: (() => {
        const pending = selectQuickAddPending(state)
        return (
          pending?.sourceNodeId === nodeId &&
          (pending.sourceHandle ?? null) === normalizedHandle
        )
      })(),
    })
  )

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
        <div className={styles.label({ class: labelClassName })}>{label}</div>
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
          <Button
            size="icon-xs"
            variant="outline"
            className={styles.quickAddButton()}
            aria-label={`Quick add from ${nodeId}${normalizedHandle ? `:${normalizedHandle}` : ""}`}
            onClick={(event) => {
              event.stopPropagation()
              startQuickAddFromOutput(nodeId, normalizedHandle)
            }}
          >
            <PlusIcon className={styles.icon()} />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
