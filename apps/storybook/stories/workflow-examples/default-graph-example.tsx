"use client"

import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraph,
} from "@flow/flow"

import { ExamplePreview } from "./example-preview"

const initialGraph = createInitialGraph(builtinDefinitions, {
  nodes: [],
  edges: [],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    metadata: { source: "docs-demo" },
  },
})

const code = `import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraph,
} from "@flow/flow"

const initialGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    { id: "demo-inline-expression", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "demo-extractor", kind: "extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } },
    { id: "demo-set-variable", kind: "setVariable", label: "Setter", config: { variableName: "email", valueExpression: "{{ email }}" } },
    { id: "demo-evaluator", kind: "evaluator", config: { conditions: [{ id: "demo-evaluator-condition", left: { type: "value", value: "{{ email }}" }, operator: "contains", right: { type: "value", value: "@" } }], logicalOperator: "and" } },
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
  return (
    <WorkflowEditor
      definitions={builtinDefinitions}
      initialGraph={initialGraph}
    />
  )
}`

export function DefaultGraphExample() {
  return (
    <ExamplePreview
      title="With default graph"
      code={code}
    >
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={initialGraph}
      />
    </ExamplePreview>
  )
}
