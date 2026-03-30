"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asNumber, asText, useBaseNodeData } from "../shared"

export function CustomInputNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)

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
