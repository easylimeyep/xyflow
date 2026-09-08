"use client"

import type { NodeProps } from "@xyflow/react"

import { EvaluatorView } from "../evaluator-shared"
import { evaluator } from "./definition"

export function EvaluatorNode({ id, data, selected }: NodeProps) {
  return (
    <EvaluatorView
      nodeId={id}
      data={data}
      selected={selected}
      kind="evaluator"
      fallbackTitle="Evaluator"
      outputs={evaluator.outputs}
    />
  )
}
