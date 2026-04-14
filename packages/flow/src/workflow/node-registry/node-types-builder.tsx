"use client"

import type { NodeProps, NodeTypes } from "@xyflow/react"

import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import "./component-bindings"
import type { NodeDefinition } from "./define-node"

export function buildNodeTypes(
  definitions: readonly NodeDefinition[]
): NodeTypes {
  return Object.fromEntries(
    definitions.map((definition) => [
      definition.kind,
      definition.component ??
        function GeneratedNode(props: NodeProps) {
          return <DefaultNodeRenderer {...props} definition={definition} />
        },
    ])
  )
}
