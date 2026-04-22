"use client"

import { WorkflowEditor } from "@workspace/flow"

import { ExamplePreview } from "./example-preview"

const code = `import { WorkflowEditor } from "@workspace/flow"

export function Example() {
  return <WorkflowEditor />
}`

export function BaseExample() {
  return (
    <ExamplePreview
      title="Base"
      description="Текущий минимальный сценарий без дополнительных пропсов."
      code={code}
    >
      <WorkflowEditor />
    </ExamplePreview>
  )
}
