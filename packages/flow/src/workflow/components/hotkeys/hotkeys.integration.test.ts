// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createClipboardHotkeyHandler,
  createGroupHotkeyHandler,
  createHistoryHotkeyHandler,
  createNodeEditHotkeyHandler,
} from "./hotkeys"
import { createWorkflowStore } from "../../store"
import type { WorkflowNode } from "../../types"

import { createKeywordSampleGraph } from "../../default-graph"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
/**
 * The editor's own default document is empty now — the node vocabulary belongs
 * to the consumer, so the package has no kind it may seed one with. These
 * suites are about behaviour over a populated graph, so they pass the sample
 * document the default used to be.
 */

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
    const workflowStore = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createKeywordSampleGraph(builtinBaseDefinitions),
    })
    const state = workflowStore.getState()
    const sourceNode = state.graph.nodes.find(
      (node: WorkflowNode) =>
        node.data.kind === "inlineExpression" &&
        node.data.config.isRoot === true
    )
    if (!sourceNode) {
      throw new Error("source node not found")
    }

    state.startQuickAddFromOutput(sourceNode.id, null)
    state.confirmQuickAddNode("evaluator")

    const beforeDeleteState = workflowStore.getState()
    const quickAddedNodeId = beforeDeleteState.selectedNodeIds[0]
    if (!quickAddedNodeId) {
      throw new Error("quick-added node not found")
    }
    const quickAddEdge = beforeDeleteState.graph.edges.find(
      (edge) =>
        edge.source === sourceNode.id && edge.target === quickAddedNodeId
    )
    if (!quickAddEdge) {
      throw new Error("quick-add edge not found")
    }

    const nodesBeforeDelete = beforeDeleteState.graph.nodes.length
    const edgesBeforeDelete = beforeDeleteState.graph.edges.length

    workflowStore
      .getState()
      .onNodesChange([{ id: quickAddedNodeId, type: "remove" }])
    workflowStore
      .getState()
      .onEdgesChange([{ id: quickAddEdge.id, type: "remove" }])

    const deletedState = workflowStore.getState()
    expect(deletedState.graph.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(deletedState.graph.edges.length).toBe(edgesBeforeDelete - 1)

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
    expect(undoState.graph.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.graph.edges.length).toBe(edgesBeforeDelete)

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "y",
        ctrlKey: true,
        bubbles: true,
      })
    )

    const redoState = workflowStore.getState()
    expect(redoState.graph.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(redoState.graph.edges.length).toBe(edgesBeforeDelete - 1)

    window.removeEventListener("keydown", handler)
  })

  it("restores deleted node and edge through undo hotkey when edge removal happens first", () => {
    const workflowStore = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createKeywordSampleGraph(builtinBaseDefinitions),
    })
    const state = workflowStore.getState()
    const sourceNode = state.graph.nodes.find(
      (node: WorkflowNode) =>
        node.data.kind === "inlineExpression" &&
        node.data.config.isRoot === true
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
    const quickAddEdge = beforeDeleteState.graph.edges.find(
      (edge) =>
        edge.source === sourceNode.id && edge.target === quickAddedNodeId
    )
    if (!quickAddEdge) {
      throw new Error("quick-add edge not found")
    }

    const nodesBeforeDelete = beforeDeleteState.graph.nodes.length
    const edgesBeforeDelete = beforeDeleteState.graph.edges.length

    workflowStore
      .getState()
      .onEdgesChange([{ id: quickAddEdge.id, type: "remove" }])
    workflowStore
      .getState()
      .onNodesChange([{ id: quickAddedNodeId, type: "remove" }])

    const deletedState = workflowStore.getState()
    expect(deletedState.graph.nodes.length).toBe(nodesBeforeDelete - 1)
    expect(deletedState.graph.edges.length).toBe(edgesBeforeDelete - 1)

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
    expect(undoState.graph.nodes.length).toBe(nodesBeforeDelete)
    expect(undoState.graph.edges.length).toBe(edgesBeforeDelete)

    window.removeEventListener("keydown", handler)
  })
})

describe("createClipboardHotkeyHandler integration", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("calls copy and paste actions on global hotkeys", () => {
    const onCopy = vi.fn()
    const onPaste = vi.fn()
    const handler = createClipboardHotkeyHandler(onCopy, onPaste)
    window.addEventListener("keydown", handler)

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
      })
    )
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
      })
    )

    window.removeEventListener("keydown", handler)
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onPaste).toHaveBeenCalledTimes(1)
  })
})

describe("createNodeEditHotkeyHandler integration", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("calls duplicate and delete actions on global hotkeys", () => {
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()
    const handler = createNodeEditHotkeyHandler(onDuplicate, onDelete)
    window.addEventListener("keydown", handler)

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "d",
        ctrlKey: true,
        bubbles: true,
      })
    )
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Backspace",
        bubbles: true,
      })
    )

    window.removeEventListener("keydown", handler)
    expect(onDuplicate).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it("does not call delete from editable targets", () => {
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()
    const handler = createNodeEditHotkeyHandler(onDuplicate, onDelete)
    window.addEventListener("keydown", handler)

    const input = document.createElement("input")
    document.body.appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Backspace",
        bubbles: true,
      })
    )

    window.removeEventListener("keydown", handler)
    expect(onDuplicate).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
  })
})

describe("createGroupHotkeyHandler integration", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("groups with Mod+G and ungroups with Mod+Shift+G, suppressing the browser", () => {
    const store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: createKeywordSampleGraph(builtinBaseDefinitions),
    })
    const nodeIds = store.getState().graph.nodes.map((node) => node.id)
    store.getState().setSelectedNodes(nodeIds)
    const handler = createGroupHotkeyHandler(
      () => store.getState().groupNodes(),
      () => store.getState().ungroup()
    )
    window.addEventListener("keydown", handler)

    const groupEvent = new KeyboardEvent("keydown", {
      key: "п",
      code: "KeyG",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(groupEvent)
    expect(groupEvent.defaultPrevented).toBe(true)
    expect(store.getState().graph.groups).toHaveLength(1)

    const ungroupEvent = new KeyboardEvent("keydown", {
      key: "G",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(ungroupEvent)
    window.removeEventListener("keydown", handler)

    expect(ungroupEvent.defaultPrevented).toBe(true)
    expect(store.getState().graph.groups).toHaveLength(0)
  })
})
