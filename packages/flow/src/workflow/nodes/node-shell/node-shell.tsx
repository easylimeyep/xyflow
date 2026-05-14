"use client"

import { Handle, Position } from "@xyflow/react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { CircleAlert } from "lucide-react"
import type { ReactNode } from "react"

import {
  nodeHandlesStyles,
  nodeShellStyles,
} from "../../../styles/components/nodes"
import type { OutputHandle } from "../../node-registry/define-node"
import type { NormalizedWorkflowNodeValidationMessage } from "../../types"
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
  const styles = nodeShellStyles({ selected, validation: hasValidation })
  const handleStyles = nodeHandlesStyles({ kind: "target" })

  return (
    <div
      className={styles.root()}
      data-testid="workflow-node"
      data-node-id={nodeId}
      data-validation={hasValidation ? "true" : "false"}
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
          {headerAccessory || hasValidation ? (
            <div className={styles.headerActions()}>
              {hasValidation ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={styles.validationButton()}
                        aria-label="Node validation messages"
                        data-testid="node-validation-indicator"
                      >
                        <CircleAlert className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className={styles.validationTooltip()}>
                      <div className={styles.validationList()}>
                        {validationMessages.map((message) => (
                          <div key={message.key}>{message.message}</div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              {headerAccessory ? (
                <div className={styles.headerAccessory()}>{headerAccessory}</div>
              ) : null}
            </div>
          ) : null}
        </div>
        {children}
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
