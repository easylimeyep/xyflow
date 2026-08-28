"use client"

import {
  WorkflowEditor,
  createInitialGraph,
  type WorkflowRuntimeOverlay,
} from "@flow/flow"

import { ExamplePreview } from "./example-preview"

const initialGraph = createInitialGraph({
  nodes: [
    {
      id: "obs-input",
      kind: "inlineExpression",
      config: { template: ["lead"], isRoot: true, repeatable: false },
    },
    {
      id: "obs-extract",
      kind: "extractor",
      config: { tokenNumber: 1, extractExpression: "email", unlimited: false },
    },
    {
      id: "obs-transform",
      kind: "setVariable",
      label: "Normalize (loop)",
      config: { variableName: "email", valueExpression: "{{ email }}" },
    },
    {
      id: "obs-branch",
      kind: "evaluator",
      label: "Has company domain",
      config: {
        conditions: [
          {
            id: "obs-branch-condition",
            left: { type: "value", value: "{{ email }}" },
            operator: "contains",
            right: { type: "value", value: "@company.com" },
          },
        ],
        logicalOperator: "and",
      },
    },
    { id: "obs-pass", kind: "result", label: "Qualified", config: { category: "true" } },
    { id: "obs-skip", kind: "result", label: "Rejected", config: { category: "false" } },
  ],
  edges: [
    { id: "obs-edge-input-extract", source: "obs-input", target: "obs-extract" },
    {
      id: "obs-edge-extract-transform",
      source: "obs-extract",
      target: "obs-transform",
    },
    {
      id: "obs-edge-transform-branch",
      source: "obs-transform",
      target: "obs-branch",
    },
    {
      id: "obs-edge-branch-pass",
      source: "obs-branch",
      sourceHandle: "evaluator-true",
      target: "obs-pass",
    },
    {
      id: "obs-edge-branch-skip",
      source: "obs-branch",
      sourceHandle: "evaluator-false",
      target: "obs-skip",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.75 },
  document: {
    id: "workflow-observation-demo",
    name: "Workflow Observation Demo",
    metadata: { source: "docs-demo" },
  },
})

// The overlay is supplied entirely by the consumer. The package renders it and
// never computes any of these statuses itself.
const overlay: WorkflowRuntimeOverlay = {
  nodes: {
    "obs-input": {
      status: "done",
      output: { lead: { email: "ada@company.com" } },
    },
    "obs-extract": { status: "done", output: { email: "ada@company.com" } },
    "obs-transform": {
      status: "running",
      iteration: { current: 2, total: 3 },
      input: { email: "ada@company.com" },
    },
    "obs-branch": {
      status: "failed",
      input: { email: "ada@company.com" },
      error:
        "Expression evaluation failed: operator 'contains' expected a string operand",
    },
    "obs-pass": { status: "waiting" },
    "obs-skip": { status: "skipped" },
  },
  activeEdgeIds: ["obs-edge-extract-transform"],
  traversedEdgeIds: [
    "obs-edge-input-extract",
    "obs-edge-extract-transform",
    "obs-edge-transform-branch",
  ],
}

const code = `import {
  WorkflowEditor,
  createInitialGraph,
  type WorkflowRuntimeOverlay,
} from "@flow/flow"

import "./register-builtins"

// Runtime status is computed by YOUR engine and handed in as a prop.
const overlay: WorkflowRuntimeOverlay = {
  nodes: {
    "obs-input": { status: "done" },
    "obs-transform": { status: "running", iteration: { current: 2, total: 3 } },
    "obs-branch": { status: "failed", error: "…" },
    "obs-pass": { status: "waiting" },
    "obs-skip": { status: "skipped" },
  },
  activeEdgeIds: ["obs-edge-extract-transform"],
  traversedEdgeIds: [
    "obs-edge-input-extract",
    "obs-edge-extract-transform",
    "obs-edge-transform-branch",
  ],
}

export function Example() {
  return (
    <WorkflowEditor
      initialGraph={initialGraph}
      mode="observe"
      overlay={overlay}
    />
  )
}`

export function ObservationExample() {
  return (
    <ExamplePreview
      title="Runtime observation"
      description={
        'mode="observe" renders an externally supplied `overlay` on a read-only canvas: node status rings, a loop counter (2 / 3), a failed node, a skipped branch, and traversed/active edges. The graph cannot be mutated; selecting a node opens the read-only inspector instead of the config form.'
      }
      code={code}
    >
      <WorkflowEditor
        initialGraph={initialGraph}
        mode="observe"
        overlay={overlay}
      />
    </ExamplePreview>
  )
}
