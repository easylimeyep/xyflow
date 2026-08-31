"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { ExamplePreview } from "./example-preview"

const code = `import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

export function Example() {
  return <WorkflowEditor definitions={builtinDefinitions} />
}`

export function BaseExample() {
  return (
    <ExamplePreview
      title="Base"
      description="Текущий минимальный сценарий без дополнительных пропсов."
      code={code}
    >
      <WorkflowEditor definitions={builtinDefinitions} />
    </ExamplePreview>
  )
}
