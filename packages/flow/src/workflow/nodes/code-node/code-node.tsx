"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asText, useBaseNodeData } from "../shared"

export function CodeNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)
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
