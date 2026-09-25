"use client"

import type { NodeProps } from "@xyflow/react"

import { SetterView } from "../setter-shared/setter-view"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  return (
    <SetterView
      nodeId={id}
      data={data}
      selected={selected}
      kind="setVariable"
      fallbackTitle="Setter"
    />
  )
}
