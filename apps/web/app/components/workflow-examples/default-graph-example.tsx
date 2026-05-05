"use client"

import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

import { ExamplePreview } from "./example-preview"

const initialGraph = createInitialGraph({
  nodes: [],
  edges: [],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    metadata: { source: "docs-demo" },
  },
})

const code = `import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "demo-inline-expression", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "demo-extractor", kind: "extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } },
    { id: "demo-set-variable", kind: "setVariable", label: "Setter", config: { variableName: "email", valueExpression: "{{ email }}" } },
    { id: "demo-evaluator", kind: "evaluator", config: { conditions: [{ id: "demo-evaluator-condition", value: "{{ email }}", operator: "contains", targetValue: "@" }], logicalOperator: "and" } },
    { id: "demo-result", kind: "result", config: { category: "true" } },
  ],
  edges: [
    { id: "demo-edge-inline-to-extractor", source: "demo-inline-expression", target: "demo-extractor" },
    { id: "demo-edge-extractor-to-setter", source: "demo-extractor", target: "demo-set-variable" },
    { id: "demo-edge-setter-to-evaluator", source: "demo-set-variable", target: "demo-evaluator" },
    { id: "demo-edge-evaluator-to-result", source: "demo-evaluator", sourceHandle: "evaluator-true", target: "demo-result" },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    metadata: { source: "docs-demo" },
  },
})

export function Example() {
  return <WorkflowEditor initialGraph={initialGraph} />
}`

export function DefaultGraphExample() {
  return (
    <ExamplePreview
      title="With default graph"
      description="Пример `initialGraph`, собранного через `createInitialGraph`, где размер нод, edge metadata и позиции подставляются автоматически. Для более сложных схем можно использовать async `createInitialGraphElk`."
      code={code}
    >
      <WorkflowEditor initialGraph={initialGraph} />
    </ExamplePreview>
  )
}
