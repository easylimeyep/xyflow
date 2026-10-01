"use client"

import type { NodeProps, NodeTypes } from "@xyflow/react"

import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import { NodeContextMenu } from "../nodes/node-context-menu/node-context-menu"
import {
  SearchMarkedTitle,
  useNodeSearchMarks,
} from "../components/workflow-search/search-field-mark"
import { useBaseNodeData } from "../nodes/shared/use-base-node-data"
import type { NodeDefinition } from "./define-node"

export function buildNodeTypes(
  definitions: readonly NodeDefinition[]
): NodeTypes {
  return Object.fromEntries(
    definitions.map((definition) => {
      const NodeComponent =
        definition.view ??
        function GeneratedNode(props: NodeProps) {
          // Only the title is drawn, so it is the only field that registers
          // and a match anywhere else keeps the strong mark on the node.
          const { searchState, hasCurrentSearchField } = useNodeSearchMarks(
            props.id
          )
          const { label } = useBaseNodeData(props.data)
          return (
            <DefaultNodeRenderer
              {...props}
              definition={definition}
              searchMarks={{ searchState, hasCurrentSearchField }}
              title={
                <SearchMarkedTitle nodeId={props.id}>{label}</SearchMarkedTitle>
              }
            />
          )
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
