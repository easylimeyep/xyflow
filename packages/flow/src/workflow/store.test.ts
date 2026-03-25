import { beforeEach, describe, expect, it } from "vitest"

import { createWorkflowStore } from "./store"
import type { WorkflowNode } from "./types"

let store: ReturnType<typeof createWorkflowStore>

describe("workflow store", () => {
  beforeEach(() => {
    store = createWorkflowStore()
  })

  it("adds node and updates history", () => {
    const before = store.getState().history.present.nodes.length
    store.getState().addNode("customInput", { x: 50, y: 50 })
    const state = store.getState()

    expect(state.history.present.nodes.length).toBe(before + 1)
    expect(state.history.past.length).toBeGreaterThan(0)
  })

  it("supports undo and redo", () => {
    const workflowStore = store.getState()
    const before = workflowStore.history.present.nodes.length

    workflowStore.addNode("code", { x: 120, y: 100 })
    store.getState().undo()
    expect(store.getState().history.present.nodes.length).toBe(before)

    store.getState().redo()
    expect(store.getState().history.present.nodes.length).toBe(before + 1)
  })

  it("imports workflow from domain json", () => {
    const exportDomain = store.getState().exportDomain()
    const imported = store.getState().importFromJson(exportDomain)

    expect(imported).toBe(true)
    expect(store.getState().lastError).toBeNull()
  })

  it("sets error for invalid import json", () => {
    const imported = store.getState().importFromJson("{\"bad\":true}")

    expect(imported).toBe(false)
    expect(store.getState().lastError).toContain("domain workflow schema")
  })

  it("rejects invalid connections and keeps graph stable", () => {
    const state = store.getState()
    const trigger = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "trigger"
    )
    const transform = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!trigger || !transform) {
      throw new Error("fixture nodes not found")
    }

    const edgeCount = state.history.present.edges.length
    state.onConnect({ source: transform.id, target: trigger.id })
    const nextState = store.getState()

    expect(nextState.history.present.edges.length).toBe(edgeCount)
    expect(nextState.lastError).toContain("cannot connect")
  })

  it("creates valid connections and clears previous errors", () => {
    const state = store.getState()
    state.addNode("code", { x: 480, y: 120 })
    const trigger = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "trigger"
    )
    const code = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "code")
    if (!trigger || !code) {
      throw new Error("fixture nodes not found")
    }

    state.onConnect({ source: code.id, target: trigger.id })
    expect(store.getState().lastError).toContain("cannot connect")

    const beforeEdgeCount = store.getState().history.present.edges.length
    store.getState().onConnect({ source: trigger.id, target: code.id })
    const nextState = store.getState()

    expect(nextState.history.present.edges.length).toBe(beforeEdgeCount + 1)
    expect(nextState.lastError).toBeNull()
  })

  it("updates label and config fields as committed history changes", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const initialPastLength = state.history.past.length
    state.updateNodeLabel(targetNode.id, "Updated label")
    state.updateNodeConfigField(targetNode.id, "eventName", "updated-event")

    const nextState = store.getState()
    const updatedNode = nextState.history.present.nodes.find((node) => node.id === targetNode.id)

    expect(updatedNode?.data.label).toBe("Updated label")
    expect(updatedNode?.data.config.eventName).toBe("updated-event")
    expect(nextState.history.past.length).toBeGreaterThan(initialPastLength)
  })

  it("keeps node drag transient until drag end commit", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const basePastLength = state.history.past.length
    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: 10, y: 20 },
        dragging: true,
      },
    ])
    expect(store.getState().history.past.length).toBe(basePastLength)

    store.getState().onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: 40, y: 60 },
        dragging: false,
      },
    ])
    expect(store.getState().history.past.length).toBe(basePastLength + 1)
  })

  it("commits structural edge changes to history", () => {
    const state = store.getState()
    const basePastLength = state.history.past.length

    state.onEdgesChange([
      {
        type: "remove",
        id: state.history.present.edges[0]?.id ?? "",
      },
    ])

    expect(store.getState().history.past.length).toBe(basePastLength + 1)
  })

  it("updates viewport without committing history entries", () => {
    const state = store.getState()
    const basePastLength = state.history.past.length
    const previousNodesRef = state.history.present.nodes
    const previousEdgesRef = state.history.present.edges

    state.setViewport({ x: 111, y: 222, zoom: 1.5 })

    const nextState = store.getState()
    expect(nextState.history.present.viewport).toEqual({ x: 111, y: 222, zoom: 1.5 })
    expect(nextState.history.past.length).toBe(basePastLength)
    expect(nextState.history.present.nodes).toBe(previousNodesRef)
    expect(nextState.history.present.edges).toBe(previousEdgesRef)
  })

  it("skips viewport writes when viewport does not change", () => {
    const state = store.getState()
    const previousHistoryRef = state.history
    const previousPresentRef = state.history.present

    state.setViewport({
      x: previousPresentRef.viewport.x,
      y: previousPresentRef.viewport.y,
      zoom: previousPresentRef.viewport.zoom,
    })

    const nextState = store.getState()
    expect(nextState.history).toBe(previousHistoryRef)
    expect(nextState.history.present).toBe(previousPresentRef)
  })

  it("keeps nodes and edges stable across frequent viewport updates", () => {
    const state = store.getState()
    const basePastLength = state.history.past.length
    const initialNodesRef = state.history.present.nodes
    const initialEdgesRef = state.history.present.edges

    for (let index = 0; index < 20; index += 1) {
      state.setViewport({ x: index * 10, y: index * 5, zoom: 1 + index * 0.01 })
    }

    const nextState = store.getState()
    expect(nextState.history.past.length).toBe(basePastLength)
    expect(nextState.history.present.nodes).toBe(initialNodesRef)
    expect(nextState.history.present.edges).toBe(initialEdgesRef)
  })

  it("keeps selectedNodeIds in sync when selected nodes get removed", () => {
    const state = store.getState()
    const firstNode = state.history.present.nodes[0]
    const secondNode = state.history.present.nodes[1]
    if (!firstNode || !secondNode) {
      throw new Error("fixture node not found")
    }

    state.setSelectedNodes([firstNode.id, secondNode.id])
    state.onNodesChange([{ id: firstNode.id, type: "remove" }])

    expect(store.getState().selectedNodeIds).toEqual([secondNode.id])

    store.getState().onNodesChange([{ id: secondNode.id, type: "remove" }])
    expect(store.getState().selectedNodeIds).toEqual([])
  })

  it("creates node + connection in one history step through quick add", () => {
    const state = store.getState()
    const sourceNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!sourceNode) {
      throw new Error("source node not found")
    }

    const basePastLength = state.history.past.length
    const baseNodeCount = state.history.present.nodes.length
    const baseEdgeCount = state.history.present.edges.length

    state.startQuickAddFromOutput(sourceNode.id, null)
    expect(store.getState().quickAddPending).toEqual({
      sourceNodeId: sourceNode.id,
      sourceHandle: null,
    })
    expect(store.getState().history.past.length).toBe(basePastLength)

    state.confirmQuickAddNode("branch")
    const nextState = store.getState()
    expect(nextState.quickAddPending).toBeNull()
    expect(nextState.history.present.nodes.length).toBe(baseNodeCount + 1)
    expect(nextState.history.present.edges.length).toBe(baseEdgeCount + 1)
    expect(nextState.history.past.length).toBe(basePastLength + 1)
  })

  it("supports quick add from branch outputs with source handle", () => {
    const state = store.getState()
    state.addNode("branch", { x: 700, y: 160 })
    const branchNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "branch")
    if (!branchNode) {
      throw new Error("branch node not found")
    }

    state.startQuickAddFromOutput(branchNode.id, "branch-true")
    store.getState().confirmQuickAddNode("code")
    const edgeFromTrue = store.getState().history.present.edges.find(
      (edge) => edge.source === branchNode.id && edge.sourceHandle === "branch-true"
    )
    expect(edgeFromTrue).toBeDefined()

    store.getState().startQuickAddFromOutput(branchNode.id, "branch-false")
    store.getState().confirmQuickAddNode("customInput")
    const edgeFromFalse = store.getState().history.present.edges.find(
      (edge) => edge.source === branchNode.id && edge.sourceHandle === "branch-false"
    )
    expect(edgeFromFalse).toBeDefined()
  })

  it("restores quick-add node and edge in a single undo after node deletion", () => {
    const state = store.getState()
    const sourceNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!sourceNode) {
      throw new Error("source node not found")
    }

    state.startQuickAddFromOutput(sourceNode.id, null)
    state.confirmQuickAddNode("branch")

    const beforeDeleteState = store.getState()
    const quickAddedNodeId = beforeDeleteState.selectedNodeIds[0]
    if (!quickAddedNodeId) {
      throw new Error("quick-added node was not selected")
    }
    const quickAddEdge = beforeDeleteState.history.present.edges.find(
      (edge) => edge.source === sourceNode.id && edge.target === quickAddedNodeId
    )
    if (!quickAddEdge) {
      throw new Error("quick-add edge not found")
    }

    const pastBeforeDelete = beforeDeleteState.history.past.length
    const nodesBeforeDelete = beforeDeleteState.history.present.nodes.length
    const edgesBeforeDelete = beforeDeleteState.history.present.edges.length

    store.getState().onNodesChange([{ id: quickAddedNodeId, type: "remove" }])
    store.getState().onEdgesChange([{ id: quickAddEdge.id, type: "remove" }])

    const deletedState = store.getState()
    expect(deletedState.history.present.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(deletedState.history.present.edges.length).toBe(edgesBeforeDelete - 1)
    expect(deletedState.history.past.length).toBe(pastBeforeDelete + 1)

    store.getState().undo()
    const undoState = store.getState()
    expect(undoState.history.present.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.history.present.edges.length).toBe(edgesBeforeDelete)

    store.getState().redo()
    const redoState = store.getState()
    expect(redoState.history.present.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(redoState.history.present.edges.length).toBe(edgesBeforeDelete - 1)
  })

  it("restores node and edge in one undo when edge-remove arrives before node-remove", () => {
    const state = store.getState()
    const sourceNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!sourceNode) {
      throw new Error("source node not found")
    }

    state.startQuickAddFromOutput(sourceNode.id, null)
    state.confirmQuickAddNode("setVariable")

    const beforeDeleteState = store.getState()
    const quickAddedNodeId = beforeDeleteState.selectedNodeIds[0]
    if (!quickAddedNodeId) {
      throw new Error("quick-added node was not selected")
    }
    const quickAddEdge = beforeDeleteState.history.present.edges.find(
      (edge) => edge.source === sourceNode.id && edge.target === quickAddedNodeId
    )
    if (!quickAddEdge) {
      throw new Error("quick-add edge not found")
    }

    const pastBeforeDelete = beforeDeleteState.history.past.length
    const nodesBeforeDelete = beforeDeleteState.history.present.nodes.length
    const edgesBeforeDelete = beforeDeleteState.history.present.edges.length

    store.getState().onEdgesChange([{ id: quickAddEdge.id, type: "remove" }])
    store.getState().onNodesChange([{ id: quickAddedNodeId, type: "remove" }])

    const deletedState = store.getState()
    expect(deletedState.history.present.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(deletedState.history.present.edges.length).toBe(edgesBeforeDelete - 1)
    expect(deletedState.history.past.length).toBe(pastBeforeDelete + 1)

    store.getState().undo()
    const undoState = store.getState()
    expect(undoState.history.present.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.history.present.edges.length).toBe(edgesBeforeDelete)
  })

  it("restores multi-node delete with connected edges in one undo step", () => {
    const state = store.getState()
    state.addNode("code", { x: 700, y: 120 })

    const transformNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "transform")
    const addedCodeNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "code")
    if (!transformNode || !addedCodeNode) {
      throw new Error("fixture nodes not found")
    }

    store.getState().onConnect({ source: transformNode.id, target: addedCodeNode.id })

    const beforeDeleteState = store.getState()
    const pastBeforeDelete = beforeDeleteState.history.past.length
    const nodesBeforeDelete = beforeDeleteState.history.present.nodes.length
    const edgesBeforeDelete = beforeDeleteState.history.present.edges.length

    const removedNodeIds = new Set([transformNode.id, addedCodeNode.id])
    const removedEdgeIds = beforeDeleteState.history.present.edges
      .filter((edge) => removedNodeIds.has(edge.source) || removedNodeIds.has(edge.target))
      .map((edge) => edge.id)

    store.getState().onNodesChange([
      { id: transformNode.id, type: "remove" },
      { id: addedCodeNode.id, type: "remove" },
    ])
    store
      .getState()
      .onEdgesChange(removedEdgeIds.map((edgeId) => ({ id: edgeId, type: "remove" })))

    const deletedState = store.getState()
    expect(deletedState.history.past.length).toBe(pastBeforeDelete + 1)
    expect(deletedState.history.present.nodes.length).toBe(nodesBeforeDelete - 2)
    expect(deletedState.history.present.edges.length).toBe(edgesBeforeDelete - removedEdgeIds.length)

    store.getState().undo()
    const undoState = store.getState()
    expect(undoState.history.present.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.history.present.edges.length).toBe(edgesBeforeDelete)

    store.getState().redo()
    const redoState = store.getState()
    expect(redoState.history.present.nodes.length).toBe(nodesBeforeDelete - 2)
    expect(redoState.history.present.edges.length).toBe(edgesBeforeDelete - removedEdgeIds.length)
  })

  it("does not start quick add on occupied output and allows explicit cancel", () => {
    const state = store.getState()
    const triggerNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "trigger"
    )
    const transformNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!triggerNode || !transformNode) {
      throw new Error("fixture nodes not found")
    }

    state.startQuickAddFromOutput(triggerNode.id, null)
    expect(store.getState().quickAddPending).toBeNull()

    state.startQuickAddFromOutput(transformNode.id, null)
    expect(store.getState().quickAddPending).toEqual({
      sourceNodeId: transformNode.id,
      sourceHandle: null,
    })
    state.cancelQuickAdd()
    expect(store.getState().quickAddPending).toBeNull()
  })

  it("renames set variable references across expression fields", () => {
    const state = store.getState()
    state.addNode("setVariable", { x: 600, y: 80 })
    state.addNode("inlineExpression", { x: 900, y: 80 })

    const setVariableNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "setVariable")
    const inlineExpressionNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "inlineExpression")
    if (!setVariableNode || !inlineExpressionNode) {
      throw new Error("set variable fixture nodes not found")
    }

    state.updateNodeConfigField(setVariableNode.id, "variableName", "oldName")
    state.updateNodeConfigField(setVariableNode.id, "valueExpression", "{{ $vars.oldName }}")
    state.updateNodeConfigField(
      inlineExpressionNode.id,
      "template",
      `{{ $node("${setVariableNode.id}").item.json.oldName }}`
    )

    state.updateNodeConfigField(setVariableNode.id, "variableName", "newName")

    const nextState = store.getState()
    const nextSetVariableNode = nextState.history.present.nodes.find(
      (node) => node.id === setVariableNode.id
    )
    const nextInlineExpressionNode = nextState.history.present.nodes.find(
      (node) => node.id === inlineExpressionNode.id
    )

    expect(nextSetVariableNode?.data.config.variableName).toBe("newName")
    expect(nextSetVariableNode?.data.config.valueExpression).toBe("{{ $vars.newName }}")
    expect(nextInlineExpressionNode?.data.config.template).toBe(
      `{{ $node("${setVariableNode.id}").item.json.newName }}`
    )
  })
})
