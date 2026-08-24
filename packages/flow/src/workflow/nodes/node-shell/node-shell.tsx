"use client"

import { Handle, Position } from "@xyflow/react"
import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"
import { CircleAlert } from "lucide-react"
import type { ReactNode } from "react"

import {
  nodeHandlesStyles,
  nodeShellStyles,
} from "../../../styles/components/nodes"
import { useNodeRuntimeState } from "../../runtime"
import type { OutputHandle } from "../../node-registry/define-node"
import type {
  NodeRuntimeStatus,
  NormalizedWorkflowNodeValidationMessage,
} from "../../types"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"

const DEFAULT_OUTPUTS: OutputHandle[] = [{}]

interface NodeShellProps {
  nodeId: string
  title: string
  subtitle: string
  selected?: boolean
  showTarget?: boolean
  outputs?: OutputHandle[]
  headerAccessory?: ReactNode
  validationMessages?: NormalizedWorkflowNodeValidationMessage[]
  children?: ReactNode
}

export function NodeShell({
  nodeId,
  title,
  selected = false,
  showTarget = true,
  outputs = DEFAULT_OUTPUTS,
  headerAccessory,
  validationMessages = [],
  children,
}: NodeShellProps) {
  const hasValidation = validationMessages.length > 0
  const runtime = useNodeRuntimeState(nodeId)
  const status: NodeRuntimeStatus | "none" = runtime?.status ?? "none"
  const styles = nodeShellStyles({
    selected,
    validation: hasValidation,
    status,
  })
  const handleStyles = nodeHandlesStyles({ kind: "target" })
  const iteration = runtime?.iteration
  const showError = runtime?.status === "failed" && Boolean(runtime.error)

  return (
    <div
      className={styles.root()}
      data-testid="workflow-node"
      data-node-id={nodeId}
      data-validation={hasValidation ? "true" : "false"}
      data-node-status={runtime ? runtime.status : undefined}
    >
      <div className={styles.panel()}>
        {showTarget ? (
          <Handle
            type="target"
            position={Position.Left}
            className={handleStyles.handleBase()}
          />
        ) : null}

        <div className={styles.header()}>
          <div className={styles.title()}>{title}</div>
          {runtime || headerAccessory || hasValidation ? (
            <div className={styles.headerActions()}>
              {runtime ? (
                <span
                  className={styles.statusBadge()}
                  data-testid="node-status-badge"
                >
                  <span className={styles.statusDot()} />
                  {runtime.status}
                </span>
              ) : null}
              {iteration ? (
                <span
                  className={styles.iterationBadge()}
                  data-testid="node-iteration-badge"
                >
                  {iteration.current} / {iteration.total}
                </span>
              ) : null}
              {hasValidation ? (
                <TooltipTrigger>
                  <button
                    type="button"
                    className={styles.validationButton()}
                    aria-label="Node validation messages"
                    data-testid="node-validation-indicator"
                  >
                    <CircleAlert className="h-3.5 w-3.5" />
                  </button>
                  <Tooltip className={styles.validationTooltip()}>
                    <div className={styles.validationList()}>
                      {validationMessages.map((message) => (
                        <div key={message.key}>{message.message}</div>
                      ))}
                    </div>
                  </Tooltip>
                </TooltipTrigger>
              ) : null}
              {headerAccessory ? (
                <div className={styles.headerAccessory()}>
                  {headerAccessory}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {children}
        {showError ? (
          <div
            className={styles.errorText()}
            title={runtime?.error}
            data-testid="node-error-text"
          >
            {runtime?.error}
          </div>
        ) : null}
      </div>

      {outputs.map((handle, index) => (
        <OutputQuickAddAffordance
          key={handle.id ?? `default-${index}`}
          nodeId={nodeId}
          sourceHandle={handle.id ?? null}
          top={handle.top}
          label={handle.label}
          labelClassName={handle.labelClassName}
        />
      ))}
    </div>
  )
}
