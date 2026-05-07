import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowEdge, WorkflowGraphState, WorkflowNode } from "../types/types"
import { createWorkflowStore } from "./store"

function createRepresentativeGraph(nodeCount = 180): WorkflowGraphState {
  const nodes: WorkflowNode[] = []
  const edges: WorkflowEdge[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const node = createWorkflowNode("inlineExpression", {
      x: (index % 12) * 220,
      y: Math.floor(index / 12) * 140,
    })
    if (index === 0) {
      node.data.config.isRoot = true
    }
    nodes.push(node)

    if (index === 0) {
      continue
    }

    const previousNode = nodes[index - 1]
    if (!previousNode) {
      throw new Error("expected previous node when building representative graph")
    }

    edges.push({
      id: `${previousNode.id}-${node.id}`,
      source: previousNode.id,
      target: node.id,
      sourceHandle: null,
      targetHandle: null,
      data: {
        sourceKind: previousNode.data.kind,
        targetKind: node.data.kind,
      },
    })
  }

  return {
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 1 },
    document: {
      id: "perf-doc",
      name: "Representative Flow",
      version: 1,
      metadata: {},
    },
  }
}

describe("workflow interaction performance budgets", () => {
  it("keeps transient drag updates within a frame-safe latency budget on representative graphs", () => {
    const store = createWorkflowStore({
      initialGraph: createRepresentativeGraph(),
    })
    const targetNode = store.getState().history.present.nodes[90]
    if (!targetNode) {
      throw new Error("expected target node in representative graph")
    }

    const initialVersion = store.getState().expressionStructuralVersion
    const initialExpressionDepsRef = store.getState().expressionDeps
    const initialExpressionCatalogRef = store.getState().expressionCatalogCache
    const dragStartPosition = { ...targetNode.position }
    const startTime = performance.now()

    for (let index = 0; index < 120; index += 1) {
      store.getState().onNodesChange([
        {
          id: targetNode.id,
          type: "position",
          position: {
            x: dragStartPosition.x + index + 1,
            y: dragStartPosition.y + index + 1,
          },
          dragging: true,
        },
      ])
    }

    store.getState().onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: {
          x: dragStartPosition.x + 140,
          y: dragStartPosition.y + 140,
        },
        dragging: false,
      },
    ])

    const durationMs = performance.now() - startTime
    const averageTransientUpdateMs = durationMs / 121
    expect(averageTransientUpdateMs).toBeLessThan(8)
    expect(store.getState().history.past).toHaveLength(1)
    expect(store.getState().expressionStructuralVersion).toBe(initialVersion)
    expect(store.getState().expressionDeps).toBe(initialExpressionDepsRef)
    expect(store.getState().expressionCatalogCache).toBe(
      initialExpressionCatalogRef
    )
  })

  it("keeps viewport bursts lightweight enough for smooth pan/zoom interaction", () => {
    const store = createWorkflowStore({
      initialGraph: createRepresentativeGraph(),
    })
    const initialNodesRef = store.getState().history.present.nodes
    const initialEdgesRef = store.getState().history.present.edges

    const startTime = performance.now()

    for (let index = 0; index < 240; index += 1) {
      store.getState().setViewport({
        x: index * 6,
        y: index * 3,
        zoom: 1 + index * 0.0025,
      })
    }

    const durationMs = performance.now() - startTime
    const averageViewportUpdateMs = durationMs / 240
    const nextState = store.getState()
    expect(averageViewportUpdateMs).toBeLessThan(1)
    expect(nextState.history.past).toHaveLength(0)
    expect(nextState.history.present.nodes).toBe(initialNodesRef)
    expect(nextState.history.present.edges).toBe(initialEdgesRef)
  })
})
