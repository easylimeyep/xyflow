"use client"

import type { NodeProps, NodeTypes } from "@xyflow/react"
import type { ComponentType } from "react"

import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import { NodeContextMenu } from "../nodes/node-context-menu/node-context-menu"
import type { NodeDefinition } from "./define-node"
import { nodeComponents } from "./view-registry"

export function buildNodeTypes(
  definitions: readonly NodeDefinition[],
  components: Partial<Record<string, ComponentType<NodeProps>>> = nodeComponents
): NodeTypes {
  return Object.fromEntries(
    definitions.map((definition) => {
      const NodeComponent =
        components[definition.kind] ??
        function GeneratedNode(props: NodeProps) {
          return <DefaultNodeRenderer {...props} definition={definition} />
        }

      return [
        definition.kind,
        function GeneratedNodeWithContextMenu(props: NodeProps) {
          return <NodeContextMenu {...props}>{NodeComponent}</NodeContextMenu>
        },
      ]
    })
  )
}
