"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asText, useBaseNodeData } from "../shared"

export function BranchNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)

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
