import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types/types"
import { createWorkflowStore } from "./store"
import {
  selectVisibleGlobalValidationMessages,
  selectVisibleValidationMessagesForNode,
} from "./selectors"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../node-registry/registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

function createRepresentativeGraph(nodeCount = 180): WorkflowGraphState {
  const nodes: WorkflowNode[] = []
  const edges: WorkflowEdge[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const node = createWorkflowNode(registry, "inlineExpression", {
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
      throw new Error(
        "expected previous node when building representative graph"
      )
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

describe("expression cache identity across a graph commit", () => {
  function catalogIdentities(store: ReturnType<typeof createWorkflowStore>) {
    const state = store.getState()
    return state.history.present.nodes.map((node) => ({
      id: node.id,
      options: state.expressionCatalogCache.get(node.id),
      types: state.expressionVariableTypesCache.get(node.id),
    }))
  }

  it("keeps the catalog reference of every untouched node when a node is added", () => {
    // Adding a node rebuilds every node's catalog, because the scope resolver
    // is host code and cannot say whose answer changed. What must not happen
    // is a NEW reference for an answer that did not change: the catalog
    // selectors compare with `Object.is`, so that used to re-render every node
    // on the canvas for one drop from the palette.
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createRepresentativeGraph(40),
    })
    const before = catalogIdentities(store)

    store.getState().addNode("inlineExpression", { x: 4000, y: 4000 })

    const after = store.getState()
    const churned = before.filter(
      (entry) =>
        after.expressionCatalogCache.get(entry.id) !== entry.options ||
        after.expressionVariableTypesCache.get(entry.id) !== entry.types
    )

    expect(churned).toEqual([])
  })

  it("hands the affected node a new catalog reference when its variables change", () => {
    const producer = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    producer.data.config.variableName = "total"
    const consumer = createWorkflowNode(registry, "inlineExpression", {
      x: 220,
      y: 0,
    })
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: {
        nodes: [producer, consumer],
        edges: [
          {
            id: `${producer.id}-${consumer.id}`,
            source: producer.id,
            target: consumer.id,
            sourceHandle: null,
            targetHandle: null,
            data: {
              sourceKind: producer.data.kind,
              targetKind: consumer.data.kind,
            },
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
        document: {
          id: "identity-doc",
          name: "Identity",
          version: 1,
          metadata: {},
        },
      },
    })

    const beforeConsumerCatalog = store
      .getState()
      .expressionCatalogCache.get(consumer.id)
    expect(beforeConsumerCatalog).toHaveLength(1)

    store.getState().updateNodeConfig(producer.id, {
      kind: "setVariable",
      key: "variableName",
      value: "grandTotal",
    })

    expect(store.getState().expressionCatalogCache.get(consumer.id)).not.toBe(
      beforeConsumerCatalog
    )
  })
})

describe("workflow interaction performance budgets", () => {
  it("keeps transient drag updates within a frame-safe latency budget on representative graphs", () => {
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
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

  it("leaves every untouched node object alone when a drag is committed", () => {
    // Committing a drag to history used to deep-clone the whole graph, which
    // handed ReactFlow a brand-new object for every node and re-rendered the
    // entire canvas on mouse-up. Only the dragged node may change identity.
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createRepresentativeGraph(),
    })
    const nodesBeforeDrag = store.getState().history.present.nodes
    const draggedNode = nodesBeforeDrag[90]
    if (!draggedNode) {
      throw new Error("expected target node in representative graph")
    }

    const dragStartPosition = { ...draggedNode.position }
    const committedPosition = {
      x: dragStartPosition.x + 140,
      y: dragStartPosition.y + 140,
    }

    store.getState().onNodesChange([
      {
        id: draggedNode.id,
        type: "position",
        position: { x: dragStartPosition.x + 40, y: dragStartPosition.y + 40 },
        dragging: true,
      },
    ])
    store.getState().onNodesChange([
      {
        id: draggedNode.id,
        type: "position",
        position: committedPosition,
        dragging: false,
      },
    ])

    const nodesAfterDrag = store.getState().history.present.nodes
    const changedNodeIds = nodesAfterDrag
      .filter((node, index) => node !== nodesBeforeDrag[index])
      .map((node) => node.id)

    expect(changedNodeIds).toEqual([draggedNode.id])
    expect(store.getState().history.present.edges).toBe(
      store.getState().history.past[0]?.edges
    )
  })

  it("restores the pre-drag position on undo without aliasing the committed graph", () => {
    // Dropping the defensive deep clone only holds while history entries stay
    // immutable, so undo must still hand back the original position.
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createRepresentativeGraph(),
    })
    const draggedNode = store.getState().history.present.nodes[90]
    if (!draggedNode) {
      throw new Error("expected target node in representative graph")
    }

    const dragStartPosition = { ...draggedNode.position }

    store.getState().onNodesChange([
      {
        id: draggedNode.id,
        type: "position",
        position: { x: dragStartPosition.x + 40, y: dragStartPosition.y + 40 },
        dragging: true,
      },
    ])
    store.getState().onNodesChange([
      {
        id: draggedNode.id,
        type: "position",
        position: {
          x: dragStartPosition.x + 140,
          y: dragStartPosition.y + 140,
        },
        dragging: false,
      },
    ])

    store.getState().undo()

    const undoneNode = store
      .getState()
      .history.present.nodes.find((node) => node.id === draggedNode.id)
    expect(undoneNode?.position).toEqual(dragStartPosition)

    store.getState().redo()

    const redoneNode = store
      .getState()
      .history.present.nodes.find((node) => node.id === draggedNode.id)
    expect(redoneNode?.position).toEqual({
      x: dragStartPosition.x + 140,
      y: dragStartPosition.y + 140,
    })
  })

  it("answers an empty validation catalog with one stable reference per selector", () => {
    // `useWorkflowStore` compares selector output with `Object.is`. A fresh
    // `[]` per call made every node on the canvas re-render on every store
    // update, so selecting one node repainted the whole canvas.
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createRepresentativeGraph(24),
    })
    const nodeId = store.getState().history.present.nodes[3]?.id
    if (!nodeId) {
      throw new Error("expected a node in the representative graph")
    }

    const before = selectVisibleValidationMessagesForNode(
      store.getState(),
      nodeId
    )
    const beforeGlobal = selectVisibleGlobalValidationMessages(store.getState())

    store.getState().setSelectedNodes([nodeId])

    expect(
      selectVisibleValidationMessagesForNode(store.getState(), nodeId)
    ).toBe(before)
    expect(selectVisibleGlobalValidationMessages(store.getState())).toBe(
      beforeGlobal
    )
  })

  it("reuses one filtered array per validation state, so a selection leaves it alone", () => {
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createRepresentativeGraph(24),
    })
    const nodeId = store.getState().history.present.nodes[5]?.id
    if (!nodeId) {
      throw new Error("expected a node in the representative graph")
    }

    store.getState().setValidation({
      nodes: [{ nodeId, message: "required" }],
      global: [{ message: "workflow is incomplete" }],
    })

    const messages = selectVisibleValidationMessagesForNode(
      store.getState(),
      nodeId
    )
    const globalMessages = selectVisibleGlobalValidationMessages(
      store.getState()
    )
    expect(messages).toHaveLength(1)
    expect(globalMessages).toHaveLength(1)

    store.getState().setSelectedNodes([nodeId])

    expect(
      selectVisibleValidationMessagesForNode(store.getState(), nodeId)
    ).toBe(messages)
    expect(selectVisibleGlobalValidationMessages(store.getState())).toBe(
      globalMessages
    )

    // Hiding replaces the validation state, so the memo has to answer afresh.
    store.getState().hideValidationForNode(nodeId)
    expect(
      selectVisibleValidationMessagesForNode(store.getState(), nodeId)
    ).toHaveLength(0)
  })

  it("keeps viewport bursts lightweight enough for smooth pan/zoom interaction", () => {
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
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
