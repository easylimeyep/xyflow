"use client"

import {
  WorkflowEditor,
  createInitialGraph,
  type WorkflowRuntimeOverlay,
} from "@flow/flow"

const initialGraph = createInitialGraph({
  nodes: [
    {
      id: "observe-input",
      kind: "inlineExpression",
      config: { template: ["lead"], isRoot: true, repeatable: false },
    },
    {
      id: "observe-extract",
      kind: "extractor",
      config: { tokenNumber: 1, extractExpression: "email", unlimited: false },
    },
    {
      id: "observe-result",
      kind: "result",
      label: "Done",
      config: { category: "true" },
    },
  ],
  edges: [
    {
      id: "observe-edge-input-extract",
      source: "observe-input",
      target: "observe-extract",
    },
    {
      id: "observe-edge-extract-result",
      source: "observe-extract",
      target: "observe-result",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-observe-smoke",
    name: "Observe Smoke",
    metadata: { source: "e2e" },
  },
})

const overlay: WorkflowRuntimeOverlay = {
  nodes: {
    "observe-input": { status: "done", output: { email: "ada@company.com" } },
    "observe-extract": {
      status: "running",
      iteration: { current: 1, total: 2 },
    },
    "observe-result": { status: "waiting" },
  },
  activeEdgeIds: ["observe-edge-extract-result"],
  traversedEdgeIds: ["observe-edge-input-extract"],
}

/**
 * Serializes the live graph into a stable JSON string the smoke test reads
 * before and after attempting mutations, to prove the graph is byte-identical.
 */
function GraphProbe() {
  const graph = WorkflowEditor.use.graph()
  const serialized = JSON.stringify({
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  })

  return (
    <pre
      data-testid="observe-graph-json"
      style={{ position: "absolute", left: -99999, top: -99999 }}
    >
      {serialized}
    </pre>
  )
}

export default function ObservePage() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        initialGraph={initialGraph}
        mode="observe"
        overlay={overlay}
      >
        <WorkflowEditor.Toolbar />
        <WorkflowEditor.Body>
          <WorkflowEditor.ValidationAlert />
          <WorkflowEditor.Canvas />
          <WorkflowEditor.ConfigPanel />
        </WorkflowEditor.Body>
        <GraphProbe />
      </WorkflowEditor>
    </div>
  )
}
