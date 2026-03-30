"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asRecord, asText } from "../shared/node-data-utils"

export function TriggerNode({ id, data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)
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
