"use client"

import { Handle, Position } from "@xyflow/react"
import type { ReactNode } from "react"

interface NodeShellProps {
  title: string
  subtitle: string
  selected?: boolean
  showTarget?: boolean
  showSource?: boolean
  extraSourceHandles?: { id: string; top: number; label: string }[]
  children?: ReactNode
}

export function NodeShell({
  title,
  subtitle,
  selected = false,
  showTarget = true,
  showSource = true,
  extraSourceHandles,
  children,
}: NodeShellProps) {
  return (
    <div
      className={`w-[260px] rounded-md border bg-white px-3 py-2 shadow-sm dark:bg-neutral-900 ${
        selected ? "border-2 border-black ring-2 ring-black/40 shadow-md dark:border-white dark:ring-white/50" : ""
      }`}
    >
      {showTarget ? <Handle type="target" position={Position.Left} /> : null}

      <div className="mb-0.5 text-xs font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      {children}

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
