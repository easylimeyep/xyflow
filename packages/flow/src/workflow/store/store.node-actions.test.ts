// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createWorkflowStore } from "./store"
import type { WorkflowNode } from "../types/types"

function findRootKeywordNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find(
    (node) =>
      node.data.kind === "inlineExpression" && node.data.config.isRoot === true
  )
}

describe("workflow store node actions", () => {
  const clipboardWriteTextMock = vi.fn()

  beforeEach(() => {
    clipboardWriteTextMock.mockReset()
    clipboardWriteTextMock.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, "clipboard", {
      value: {
        writeText: clipboardWriteTextMock,
        readText: vi.fn().mockResolvedValue(""),
      },
      configurable: true,
    })
  })

  it("duplicates selected nodes with internal edges, unique labels, selection, and one undo step", () => {
    const store = createWorkflowStore()
    const state = store.getState()
    const rootNode = findRootKeywordNode(state.history.present.nodes)
    if (!rootNode) {
      throw new Error("root node not found")
    }

    state.addNode("setVariable", { x: 320, y: 100 })
    state.addNode("extractor", { x: 640, y: 100 })
    const graphWithNodes = store.getState().history.present
    const setVariableNode = graphWithNodes.nodes.find(
      (node) => node.data.kind === "setVariable"
    )
    const extractorNode = graphWithNodes.nodes.find(
      (node) => node.data.kind === "extractor"
    )
    if (!setVariableNode || !extractorNode) {
      throw new Error("fixture nodes not found")
    }

    store
      .getState()
      .onConnect({ source: setVariableNode.id, target: extractorNode.id })
    store.getState().setSelectedNodes([setVariableNode.id, extractorNode.id])
    const beforeDuplicateState = store.getState()
    const pastBeforeDuplicate = beforeDuplicateState.history.past.length

    const duplicated = store.getState().duplicateNodes()

    expect(duplicated).toBe(true)
    expect(clipboardWriteTextMock).not.toHaveBeenCalled()

    const duplicatedState = store.getState()
    const duplicatedNodeIds = duplicatedState.selectedNodeIds
    expect(duplicatedNodeIds).toHaveLength(2)
    expect(duplicatedState.history.present.nodes).toHaveLength(
      beforeDuplicateState.history.present.nodes.length + 2
    )
    expect(duplicatedState.history.past.length).toBe(pastBeforeDuplicate + 1)

    const duplicatedNodes = duplicatedState.history.present.nodes.filter((node) =>
      duplicatedNodeIds.includes(node.id)
    )
    expect(duplicatedNodes.map((node) => node.data.label).sort()).toEqual([
      "Extractor 2",
      "Setter 2",
    ])
    expect(duplicatedNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          position: {
            x: setVariableNode.position.x + 40,
            y: setVariableNode.position.y + 40,
          },
        }),
        expect.objectContaining({
          position: {
            x: extractorNode.position.x + 40,
            y: extractorNode.position.y + 40,
          },
        }),
      ])
    )

    const duplicatedEdge = duplicatedState.history.present.edges.find(
      (edge) =>
        duplicatedNodeIds.includes(edge.source) &&
        duplicatedNodeIds.includes(edge.target)
    )
    expect(duplicatedEdge).toBeDefined()

    store.getState().undo()
    expect(store.getState().history.present.nodes).toHaveLength(
      beforeDuplicateState.history.present.nodes.length
    )
    expect(store.getState().history.present.edges).toHaveLength(
      beforeDuplicateState.history.present.edges.length
    )
  })

  it("deletes selected nodes and connected edges in one undo step", () => {
    const store = createWorkflowStore()
    const state = store.getState()
    const rootNode = findRootKeywordNode(state.history.present.nodes)
    if (!rootNode) {
      throw new Error("root node not found")
    }

    state.addNode("setVariable", { x: 320, y: 100 })
    const addedNode = store
      .getState()
      .history.present.nodes.find((node) => node.data.kind === "setVariable")
    if (!addedNode) {
      throw new Error("added node not found")
    }

    store.getState().onConnect({ source: rootNode.id, target: addedNode.id })
    store.getState().setSelectedNode(addedNode.id)
    const beforeDeleteState = store.getState()
    const deleted = store.getState().deleteNodes()

    expect(deleted).toBe(true)
    expect(store.getState().history.present.nodes).toHaveLength(
      beforeDeleteState.history.present.nodes.length - 1
    )
    expect(store.getState().history.present.edges).toHaveLength(
      beforeDeleteState.history.present.edges.length - 1
    )

    store.getState().undo()
    expect(store.getState().history.present.nodes).toHaveLength(
      beforeDeleteState.history.present.nodes.length
    )
    expect(store.getState().history.present.edges).toHaveLength(
      beforeDeleteState.history.present.edges.length
    )
  })
})
