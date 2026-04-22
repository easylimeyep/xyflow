"use client"

import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

import { ExamplePreview } from "./example-preview"

const operators = [
  {
    id: "includes",
    value: "includes domain",
    requiresTarget: true,
  },
  {
    id: "excludes",
    value: "excludes domain",
    requiresTarget: true,
  },
  {
    id: "has-value",
    value: "has value",
    requiresTarget: false,
  },
  {
    id: "is-missing",
    value: "is missing",
    requiresTarget: false,
  },
]

const initialGraph = createInitialGraph({
  nodes: [
    {
      id: "demo-custom-operators-input",
      kind: "inlineExpression",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-custom-operators-branch",
      kind: "branch",
      label: "Email rules",
      config: {
        conditions: [
          {
            id: "demo-custom-operators-condition-contains",
            value: "{{ lead.email }}",
            operator: "includes",
            targetValue: "@company.com",
          },
          {
            id: "demo-custom-operators-condition-presence",
            value: "{{ lead.email }}",
            operator: "has-value",
            targetValue: "",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "demo-custom-operators-success",
      kind: "result",
      label: "Qualified",
      config: {
        category: "true",
      },
    },
    {
      id: "demo-custom-operators-failure",
      kind: "result",
      label: "Needs cleanup",
      config: {
        category: "false",
      },
    },
  ],
  edges: [
    {
      id: "demo-custom-operators-edge-input-to-branch",
      source: "demo-custom-operators-input",
      target: "demo-custom-operators-branch",
    },
    {
      id: "demo-custom-operators-edge-branch-to-success",
      source: "demo-custom-operators-branch",
      sourceHandle: "branch-true",
      target: "demo-custom-operators-success",
    },
    {
      id: "demo-custom-operators-edge-branch-to-failure",
      source: "demo-custom-operators-branch",
      sourceHandle: "branch-false",
      target: "demo-custom-operators-failure",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-operators",
    name: "Workflow Custom Operators Demo",
    metadata: { source: "docs-demo-custom-operators" },
  },
})

const code = `import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "demo-custom-operators-input", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    {
      id: "demo-custom-operators-branch",
      kind: "branch",
      label: "Email rules",
      config: {
        conditions: [
          { id: "demo-custom-operators-condition-contains", value: "{{ lead.email }}", operator: "includes", targetValue: "@company.com" },
          { id: "demo-custom-operators-condition-presence", value: "{{ lead.email }}", operator: "has-value", targetValue: "" },
        ],
        logicalOperator: "and",
      },
    },
    { id: "demo-custom-operators-success", kind: "result", label: "Qualified", config: { category: "true" } },
    { id: "demo-custom-operators-failure", kind: "result", label: "Needs cleanup", config: { category: "false" } },
  ],
  edges: [
    { id: "demo-custom-operators-edge-input-to-branch", source: "demo-custom-operators-input", target: "demo-custom-operators-branch" },
    { id: "demo-custom-operators-edge-branch-to-success", source: "demo-custom-operators-branch", sourceHandle: "branch-true", target: "demo-custom-operators-success" },
    { id: "demo-custom-operators-edge-branch-to-failure", source: "demo-custom-operators-branch", sourceHandle: "branch-false", target: "demo-custom-operators-failure" },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-operators",
    name: "Workflow Custom Operators Demo",
    metadata: { source: "docs-demo-custom-operators" },
  },
})

export function Example() {
  return (
    <WorkflowEditor
      initialGraph={initialGraph}
      runtime={{
        branch: {
          operators: [
            { id: "includes", value: "includes domain", requiresTarget: true },
            { id: "excludes", value: "excludes domain", requiresTarget: true },
            { id: "has-value", value: "has value", requiresTarget: false },
            { id: "is-missing", value: "is missing", requiresTarget: false },
          ],
        },
      }}
    />
  )
}`

export function CustomOperatorsExample() {
  return (
    <ExamplePreview
      title="With custom boolean operators"
      description="Пример кастомизации boolean branch-блока через `runtime.branch.operators`, где снаружи прокидываются id, label и признак `requiresTarget`."
      code={code}
    >
      <WorkflowEditor
        initialGraph={initialGraph}
        runtime={{
          branch: {
            operators,
          },
        }}
      />
    </ExamplePreview>
  )
}
