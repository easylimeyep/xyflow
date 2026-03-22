"use client"

import { Handle, Position } from "@xyflow/react"

interface NodeShellProps {
  title: string
  subtitle: string
  showTarget?: boolean
  showSource?: boolean
  extraSourceHandles?: { id: string; top: number; label: string }[]
}

export function NodeShell({
  title,
  subtitle,
  showTarget = true,
  showSource = true,
  extraSourceHandles,
}: NodeShellProps) {
  return (
    <div className="w-[260px] rounded-md border bg-white px-3 py-2 shadow-sm dark:bg-neutral-900">
      {showTarget ? <Handle type="target" position={Position.Left} /> : null}

      <div className="mb-0.5 text-xs font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>

      {extraSourceHandles?.map((handle) => (
        <div
          key={handle.id}
          className="pointer-events-none absolute -right-10 text-[10px] text-muted-foreground"
          style={{ top: `${handle.top}%` }}
        >
          {handle.label}
          <Handle id={handle.id} type="source" position={Position.Right} />
        </div>
      ))}

      {showSource ? <Handle type="source" position={Position.Right} /> : null}
    </div>
  )
}
