"use client"

import {
  WorkflowEditor,
  createInitialGraph,
  exportDomainWorkflowForBackend,
} from "@workspace/flow"
import { Button } from "@workspace/ui/components/button"

import { ExamplePreview } from "./example-preview"

const initialGraph = createInitialGraph({
  nodes: [
    {
      id: "backend-transform-root-a",
      kind: "inlineExpression",
      label: "Root A",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "backend-transform-root-b",
      kind: "inlineExpression",
      label: "Root B",
      config: {
        template: ["account"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "backend-transform-evaluator",
      kind: "evaluator",
      label: "Eligibility",
      config: {
        conditions: [
          {
            id: "backend-transform-condition",
            value: "{{ lead.email }}",
            operator: "contains",
            targetValue: "@company.com",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "backend-transform-success",
      kind: "result",
      label: "Qualified",
      config: {
        category: "true",
      },
    },
    {
      id: "backend-transform-failure",
      kind: "result",
      label: "Rejected",
      config: {
        category: "false",
      },
    },
  ],
  edges: [
    {
      id: "backend-transform-edge-root-a-evaluator",
      source: "backend-transform-root-a",
      target: "backend-transform-evaluator",
    },
    {
      id: "backend-transform-edge-root-b-evaluator",
      source: "backend-transform-root-b",
      target: "backend-transform-evaluator",
    },
    {
      id: "backend-transform-edge-evaluator-success",
      source: "backend-transform-evaluator",
      sourceHandle: "evaluator-true",
      target: "backend-transform-success",
    },
    {
      id: "backend-transform-edge-evaluator-failure",
      source: "backend-transform-evaluator",
      sourceHandle: "evaluator-false",
      target: "backend-transform-failure",
    },
  ],
  viewport: { x: 64, y: 80, zoom: 0.75 },
  document: {
    id: "workflow-demo-backend-transform",
    name: "Backend Transform Demo",
    metadata: { source: "docs-demo-backend-transform" },
  },
})

const code = `import {
  WorkflowEditor,
  createInitialGraph,
  exportDomainWorkflowForBackend,
} from "@workspace/flow"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "backend-transform-root-a", kind: "inlineExpression", label: "Root A", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "backend-transform-root-b", kind: "inlineExpression", label: "Root B", config: { template: ["account"], isRoot: true, repeatable: false } },
    { id: "backend-transform-evaluator", kind: "evaluator", label: "Eligibility", config: { conditions: [{ id: "backend-transform-condition", value: "{{ lead.email }}", operator: "contains", targetValue: "@company.com" }], logicalOperator: "and" } },
    { id: "backend-transform-success", kind: "result", label: "Qualified", config: { category: "true" } },
    { id: "backend-transform-failure", kind: "result", label: "Rejected", config: { category: "false" } },
  ],
  edges: [
    { id: "backend-transform-edge-root-a-evaluator", source: "backend-transform-root-a", target: "backend-transform-evaluator" },
    { id: "backend-transform-edge-root-b-evaluator", source: "backend-transform-root-b", target: "backend-transform-evaluator" },
    { id: "backend-transform-edge-evaluator-success", source: "backend-transform-evaluator", sourceHandle: "evaluator-true", target: "backend-transform-success" },
    { id: "backend-transform-edge-evaluator-failure", source: "backend-transform-evaluator", sourceHandle: "evaluator-false", target: "backend-transform-failure" },
  ],
  viewport: { x: 64, y: 80, zoom: 0.75 },
  document: {
    id: "workflow-demo-backend-transform",
    name: "Backend Transform Demo",
    metadata: { source: "docs-demo-backend-transform" },
  },
})

function TransformButton() {
  const exportDomain = WorkflowEditor.use.store((state) => state.exportDomain)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const backendWorkflow = exportDomainWorkflowForBackend(exportDomain())
        console.log("Backend workflow transform", backendWorkflow)
      }}
    >
      Transform
    </Button>
  )
}

export function Example() {
  return (
    <WorkflowEditor initialGraph={initialGraph}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <WorkflowEditor.Toolbar />
        <TransformButton />
      </div>
      <WorkflowEditor.Body>
        <WorkflowEditor.Palette />
        <WorkflowEditor.Canvas />
        <WorkflowEditor.ConfigPanel />
      </WorkflowEditor.Body>
    </WorkflowEditor>
  )
}`

function TransformButton() {
  const exportDomain = WorkflowEditor.use.store((state) => state.exportDomain)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const backendWorkflow = exportDomainWorkflowForBackend(exportDomain())
        console.log("Backend workflow transform", backendWorkflow)
      }}
    >
      Transform
    </Button>
  )
}

export function BackendTransformExample() {
  return (
    <ExamplePreview
      title="With backend transform"
      description="Пример отдельного backend export: кнопка Transform берет текущий domain workflow, превращает его в BackendWorkflowDTO и выводит результат в консоль браузера."
      code={code}
    >
      <WorkflowEditor initialGraph={initialGraph}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <WorkflowEditor.Toolbar />
          <TransformButton />
        </div>
        <WorkflowEditor.Body>
          <WorkflowEditor.Palette />
          <WorkflowEditor.Canvas />
          <WorkflowEditor.ConfigPanel />
        </WorkflowEditor.Body>
      </WorkflowEditor>
    </ExamplePreview>
  )
}
