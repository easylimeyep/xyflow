"use client"

import type { NodeProps } from "@xyflow/react"

import type { NodeDefinition } from "../../node-registry/define-node"
import type { ReactNode } from "react"

import type { NodeSearchStatus } from "../../store"
import { NodeShell } from "../node-shell/node-shell"
import { useBaseNodeData } from "./use-base-node-data"

interface DefaultNodeRendererProps extends NodeProps {
  definition: NodeDefinition
  /**
   * Supplied by the canvas, which owns the store. The renderer itself stays
   * free of client bindings so any definition can be drawn in isolation.
   */
  searchMarks?: {
    searchState: NodeSearchStatus
    hasCurrentSearchField: boolean
  }
  /** Replaces the plain label, e.g. with a title that carries a search mark. */
  title?: ReactNode
}

export function DefaultNodeRenderer({
  id,
  data,
  selected,
  definition,
  searchMarks,
  title,
}: DefaultNodeRendererProps) {
  const { label, config } = useBaseNodeData(data)
  const subtitle = definition.subtitle?.(config) ?? definition.description

  return (
    <NodeShell
      nodeId={id}
      title={title ?? label}
      subtitle={subtitle}
      selected={selected}
      {...searchMarks}
      showTarget={definition.showTarget ?? true}
      outputs={definition.outputs}
    />
  )
}
