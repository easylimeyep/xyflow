"use client"

import { Handle, Position } from "@xyflow/react"
import type { ReactNode } from "react"

import {
  nodeHandlesStyles,
  nodeShellStyles,
} from "../../../styles/components/nodes"
import type { OutputHandle } from "../../node-registry/define-node"
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
  children?: ReactNode
}

export function NodeShell({
  nodeId,
  title,
  selected = false,
  showTarget = true,
  outputs = DEFAULT_OUTPUTS,
  headerAccessory,
  children,
}: NodeShellProps) {
  const styles = nodeShellStyles({ selected })
  const handleStyles = nodeHandlesStyles({ kind: "target" })

  return (
    <div
      className={styles.root()}
      data-testid="workflow-node"
      data-node-id={nodeId}
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
          {headerAccessory ? (
            <div className={styles.headerAccessory()}>{headerAccessory}</div>
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
