"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function CodeNode({ id, data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)
  const runtime = asText(config.runtime) || "js"
  const code = asText(config.code)

  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle={`${runtime}: ${code.slice(0, 40)}`}
        selected={selected}
        showSource={false}
      />
      <OutputQuickAddAffordance nodeId={id} />
    </div>
  )
}
