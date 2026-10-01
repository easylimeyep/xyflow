"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { ExampleFrame } from "./example-frame"

export function BaseExample() {
  return (
    <ExampleFrame>
      <WorkflowEditor definitions={builtinDefinitions} />
    </ExampleFrame>
  )
}
