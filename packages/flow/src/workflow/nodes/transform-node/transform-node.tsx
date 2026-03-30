"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asRecord, asText } from "../shared/node-data-utils"

export function TransformNode({ id, data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)

  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle={asText(config.expression)}
        selected={selected}
        showSource={false}
      />
      <OutputQuickAddAffordance nodeId={id} />
    </div>
  )
}
