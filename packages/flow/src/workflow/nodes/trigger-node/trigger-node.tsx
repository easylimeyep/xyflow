"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asText, useBaseNodeData } from "../shared"

export function TriggerNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)
  const eventName = asText(config.eventName)
  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle={`event: ${eventName || "unset"}`}
        selected={selected}
        showTarget={false}
        showSource={false}
      />
      <OutputQuickAddAffordance nodeId={id} />
    </div>
  )
}
