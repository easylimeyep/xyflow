"use client"

import type { NodeProps } from "@xyflow/react"

import type { NodeDefinition } from "../../node-registry/define-node"
import { NodeShell } from "../node-shell/node-shell"
import { useBaseNodeData } from "./use-base-node-data"

interface DefaultNodeRendererProps extends NodeProps {
  definition: NodeDefinition
}

export function DefaultNodeRenderer({
  id,
  data,
  selected,
  definition,
}: DefaultNodeRendererProps) {
  const { label, config } = useBaseNodeData(data)
  const subtitle = definition.subtitle?.(config) ?? definition.description

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle={subtitle}
      selected={selected}
      showTarget={definition.showTarget ?? true}
      outputs={definition.outputs}
    />
  )
}
