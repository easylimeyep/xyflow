// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHistoryHotkeyHandler } from "./hotkeys"
import { createWorkflowStore } from "../store"
import type { WorkflowNode } from "../types"

describe("createHistoryHotkeyHandler integration", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("calls undo/redo for global shortcuts on non-editable target", () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)

    const undoEvent = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    })
    window.dispatchEvent(undoEvent)

    const redoEvent = new KeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      bubbles: true,
    })
    window.dispatchEvent(redoEvent)

    window.removeEventListener("keydown", handler)
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it("does not call undo/redo for events from CodeMirror/input", () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)

    const input = document.createElement("input")
    document.body.appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    )

    const cm = document.createElement("div")
    cm.className = "cm-editor"
    const cmInner = document.createElement("div")
    cm.appendChild(cmInner)
    document.body.appendChild(cm)
    cmInner.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    )

    window.removeEventListener("keydown", handler)
    expect(onUndo).not.toHaveBeenCalled()
    expect(onRedo).not.toHaveBeenCalled()
  })

  it("restores deleted node and edge through undo hotkey", () => {
    const workflowStore = createWorkflowStore()
    const state = workflowStore.getState()
    const sourceNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!sourceNode) {
      throw new Error("source node not found")
    }

    state.startQuickAddFromOutput(sourceNode.id, null)
    state.confirmQuickAddNode("branch")

    const beforeDeleteState = workflowStore.getState()
    const quickAddedNodeId = beforeDeleteState.selectedNodeIds[0]
    if (!quickAddedNodeId) {
      throw new Error("quick-added node not found")
    }
    const quickAddEdge = beforeDeleteState.history.present.edges.find(
      (edge) => edge.source === sourceNode.id && edge.target === quickAddedNodeId
    )
    if (!quickAddEdge) {
      throw new Error("quick-add edge not found")
    }

    const nodesBeforeDelete = beforeDeleteState.history.present.nodes.length
    const edgesBeforeDelete = beforeDeleteState.history.present.edges.length

    workflowStore.getState().onNodesChange([{ id: quickAddedNodeId, type: "remove" }])
    workflowStore.getState().onEdgesChange([{ id: quickAddEdge.id, type: "remove" }])

    const deletedState = workflowStore.getState()
    expect(deletedState.history.present.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(deletedState.history.present.edges.length).toBe(edgesBeforeDelete - 1)

    const handler = createHistoryHotkeyHandler(
      () => workflowStore.getState().undo(),
      () => workflowStore.getState().redo()
    )
    window.addEventListener("keydown", handler)

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    )

    const undoState = workflowStore.getState()
    expect(undoState.history.present.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.history.present.edges.length).toBe(edgesBeforeDelete)

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "y",
        ctrlKey: true,
        bubbles: true,
      })
    )

    const redoState = workflowStore.getState()
    expect(redoState.history.present.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(redoState.history.present.edges.length).toBe(edgesBeforeDelete - 1)

    window.removeEventListener("keydown", handler)
  })

  it("restores deleted node and edge through undo hotkey when edge removal happens first", () => {
    const workflowStore = createWorkflowStore()
    const state = workflowStore.getState()
    const sourceNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!sourceNode) {
      throw new Error("source node not found")
    }

    state.startQuickAddFromOutput(sourceNode.id, null)
    state.confirmQuickAddNode("setVariable")

    const beforeDeleteState = workflowStore.getState()
    const quickAddedNodeId = beforeDeleteState.selectedNodeIds[0]
    if (!quickAddedNodeId) {
      throw new Error("quick-added node not found")
    }
    const quickAddEdge = beforeDeleteState.history.present.edges.find(
      (edge) => edge.source === sourceNode.id && edge.target === quickAddedNodeId
    )
    if (!quickAddEdge) {
      throw new Error("quick-add edge not found")
    }

    const nodesBeforeDelete = beforeDeleteState.history.present.nodes.length
    const edgesBeforeDelete = beforeDeleteState.history.present.edges.length

    workflowStore.getState().onEdgesChange([{ id: quickAddEdge.id, type: "remove" }])
    workflowStore.getState().onNodesChange([{ id: quickAddedNodeId, type: "remove" }])

    const deletedState = workflowStore.getState()
    expect(deletedState.history.present.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(deletedState.history.present.edges.length).toBe(edgesBeforeDelete - 1)

    const handler = createHistoryHotkeyHandler(
      () => workflowStore.getState().undo(),
      () => workflowStore.getState().redo()
    )
    window.addEventListener("keydown", handler)

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    )

    const undoState = workflowStore.getState()
    expect(undoState.history.present.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.history.present.edges.length).toBe(edgesBeforeDelete)

    window.removeEventListener("keydown", handler)
  })
})
