"use client"

import type { NodeProps, NodeTypes } from "@xyflow/react"
import { useState } from "react"

import {
  CompactNode,
  useIsCompactNode,
} from "../nodes/compact-node/compact-node"
import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import { NodeContextMenu } from "../nodes/node-context-menu/node-context-menu"
import {
  SearchMarkedTitle,
  useNodeSearchMarks,
} from "../components/workflow-search/search-field-mark"
import { useBaseNodeData } from "../nodes/shared/use-base-node-data"
import type { NodeDefinition } from "./define-node"
import { useDeferredValueWithInitial } from "./use-deferred-value-with-initial"

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
          // Deferred, so a pan or zoom that brings many nodes into view stays
          // responsive while React mounts their full views in the background.
          // Every node mounts compact first: before the pane is measured there
          // is no viewport to cull against, and a large graph opened at a
          // readable zoom would otherwise mount every full view at once.
          const isCompact = useDeferredValueWithInitial(
            useIsCompactNode(props.id),
            true
          )
          // Fields commit on blur, so a node being edited keeps its full view
          // even when zoomed out; swapping it would drop the pending edit.
          const [hasFocusWithin, setHasFocusWithin] = useState(false)
          if (isCompact && !hasFocusWithin) {
            return <CompactNode {...props} definition={definition} />
          }

          return (
            <div
              className="contents"
              // React focus events follow the component tree, so focus moving
              // into a portaled picker or menu still counts as inside.
              onFocus={() => setHasFocusWithin(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setHasFocusWithin(false)
                }
              }}
            >
              <NodeContextMenu {...props}>{NodeComponent}</NodeContextMenu>
            </div>
          )
        },
      ]
    })
  )
}
