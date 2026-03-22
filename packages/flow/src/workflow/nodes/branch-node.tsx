"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { NodeShell } from "./node-shell"

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function BranchNode({ data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)

  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle={asText(config.condition)}
        selected={selected}
        showSource={false}
      />
      <Handle
        id="branch-true"
        type="source"
        position={Position.Right}
        style={{ top: "34%" }}
      />
      <div className="pointer-events-none absolute top-[30%] -right-12 text-[10px] font-medium text-emerald-600">
        true
      </div>
      <Handle
        id="branch-false"
        type="source"
        position={Position.Right}
        style={{ top: "72%" }}
      />
      <div className="pointer-events-none absolute top-[68%] -right-12 text-[10px] font-medium text-rose-600">
        false
      </div>
    </div>
  )
}
