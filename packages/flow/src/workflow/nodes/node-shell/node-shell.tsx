"use client"

import { Handle, Position } from "@xyflow/react"
import type { ReactNode } from "react"

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
  children?: ReactNode
}

export function NodeShell({
  nodeId,
  title,
  subtitle,
  selected = false,
  showTarget = true,
  outputs = DEFAULT_OUTPUTS,
  children,
}: NodeShellProps) {
  return (
    <div className="relative">
      <div
        className={`w-[260px] rounded-md border bg-white px-3 py-2 shadow-sm dark:bg-neutral-900 ${
          selected ? "border-2 border-black ring-2 ring-black/40 shadow-md dark:border-white dark:ring-white/50" : ""
        }`}
      >
        {showTarget ? <Handle type="target" position={Position.Left} /> : null}

        <div className="mb-0.5 text-xs font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
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
