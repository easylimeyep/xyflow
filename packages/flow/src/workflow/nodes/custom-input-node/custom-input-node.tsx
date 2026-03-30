"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asNumber, asRecord, asText } from "../shared/node-data-utils"

export function CustomInputNode({ id, data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)

  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle={`${asText(config.inputKind)} | retries: ${asNumber(config.retryCount)}`}
        selected={selected}
        showSource={false}
      />
      <OutputQuickAddAffordance nodeId={id} />
    </div>
  )
}
