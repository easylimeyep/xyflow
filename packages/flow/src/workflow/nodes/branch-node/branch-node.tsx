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

export function BranchNode({ id, data, selected }: NodeProps) {
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
      <OutputQuickAddAffordance
        nodeId={id}
        sourceHandle="branch-true"
        top="34%"
        label="true"
        labelClassName="font-medium text-emerald-600"
      />
      <OutputQuickAddAffordance
        nodeId={id}
        sourceHandle="branch-false"
        top="72%"
        label="false"
        labelClassName="font-medium text-rose-600"
      />
    </div>
  )
}
