// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { exportSelectionClipboardJson, parseSelectionClipboardJson } from "../mappers"
import { createWorkflowStore } from "./store"
import type { DomainWorkflowNodeDTO, WorkflowNode } from "../types/types"

describe("workflow store clipboard actions", () => {
  const clipboardWriteTextMock = vi.fn()
  const clipboardReadTextMock = vi.fn()

  beforeEach(() => {
    clipboardWriteTextMock.mockReset()
    clipboardReadTextMock.mockReset()
    clipboardWriteTextMock.mockResolvedValue(undefined)
    clipboardReadTextMock.mockResolvedValue("")
    const clipboard = {
      writeText: clipboardWriteTextMock,
      readText: clipboardReadTextMock,
    }
    Object.defineProperty(window.navigator, "clipboard", {
      value: clipboard,
      configurable: true,
    })
  })

  it("copies selected nodes into workflow selection payload", async () => {
    const store = createWorkflowStore()
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const triggerNode = store.getState().history.present.nodes.find((node: WorkflowNode) => node.data.kind === "trigger")
    const inlineNode = store.getState().history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "inlineExpression"
    )
    if (!triggerNode || !inlineNode) {
      throw new Error("fixture nodes not found")
    }
    store.getState().onConnect({ source: triggerNode.id, target: inlineNode.id })

    store.getState().setSelectedNodes([triggerNode.id, inlineNode.id])
    const copied = await store.getState().copySelectionToClipboard()

    expect(copied).toBe(true)
    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1)
    const rawPayload = clipboardWriteTextMock.mock.calls[0]?.[0]
    if (!rawPayload) {
      throw new Error("expected clipboard payload")
    }

    const parsed = parseSelectionClipboardJson(rawPayload)
    expect(parsed.success).toBe(true)
    expect(parsed.value?.nodes).toHaveLength(2)
    expect(parsed.value?.connections.length).toBeGreaterThan(0)
  })

  it("pastes nodes at last pointer and ensures unique label/variable names", async () => {
    const store = createWorkflowStore()
    const state = store.getState()
    state.addNode("setVariable", { x: 600, y: 160 })

    const selectedSetVariable = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "setVariable")
    if (!selectedSetVariable) {
      throw new Error("set variable fixture not found")
    }

    const payloadNodes: DomainWorkflowNodeDTO[] = [
      {
        id: "copy-set-variable",
        kind: "setVariable",
        position: { x: 40, y: 30 },
        label: selectedSetVariable.data.label,
        config: {
          variableName: "myVar",
          valueExpression: "{{ $input.item.json }}",
        },
      },
      {
        id: "copy-extractor",
        kind: "extractor",
        position: { x: 240, y: 30 },
        label: "Extractor",
        config: {
          tokenNumber: 0,
          extractExpression: "{{ $input.item.json }}",
          unlimited: false,
        },
      },
    ]
    const payload = exportSelectionClipboardJson(payloadNodes, [
      {
        id: "copy-connection",
        sourceNodeId: "copy-set-variable",
        targetNodeId: "copy-extractor",
        sourceHandle: null,
        targetHandle: null,
      },
    ])
    clipboardReadTextMock.mockResolvedValue(payload)

    const beforeNodeCount = store.getState().history.present.nodes.length
    store.getState().setLastPointerPosition({ x: 300, y: 200 })

    const pasted = await store.getState().pasteFromClipboard()
    expect(pasted).toBe(true)

    const nextState = store.getState()
    expect(nextState.history.present.nodes.length).toBe(beforeNodeCount + 2)
    expect(nextState.selectedNodeIds).toHaveLength(2)

    const pastedNodes = nextState.history.present.nodes.filter((node) =>
      nextState.selectedNodeIds.includes(node.id)
    )
    const pastedNodeIds = [...nextState.selectedNodeIds]
    const pastedSetVariable = pastedNodes.find((node) => node.data.kind === "setVariable")
    expect(pastedSetVariable?.position).toEqual({ x: 300, y: 200 })
    expect(pastedSetVariable?.data.label).toBe("Set Variable 2")
    expect(pastedSetVariable?.data.config.variableName).toBe("myVar2")

    // Regression: selection remains stable through deselect/reselect interactions after paste.
    store.getState().setSelectedNodes([])
    const stateAfterDeselect = store.getState()
    expect(stateAfterDeselect.selectedNodeIds).toHaveLength(0)

    store.getState().setSelectedNodes(pastedNodeIds)
    const stateAfterReselect = store.getState()
    const selectedSet = new Set(stateAfterReselect.selectedNodeIds)
    expect(selectedSet.size).toBe(pastedNodeIds.length)
    expect([...selectedSet]).toEqual(expect.arrayContaining(pastedNodeIds))
  })

  it("returns false for invalid clipboard payload", async () => {
    const store = createWorkflowStore()
    clipboardReadTextMock.mockResolvedValue("{\"foo\":\"bar\"}")

    const pasted = await store.getState().pasteFromClipboard()
    expect(pasted).toBe(false)
    expect(store.getState().lastError?.message).toContain("workflow selection schema")
  })

  it("returns false when clipboard write fails", async () => {
    const store = createWorkflowStore()
    const triggerNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "trigger")
    if (!triggerNode) {
      throw new Error("fixture node not found")
    }

    store.getState().setSelectedNodes([triggerNode.id])
    clipboardWriteTextMock.mockRejectedValueOnce(new Error("write failed"))

    const copied = await store.getState().copySelectionToClipboard()

    expect(copied).toBe(false)
    expect(store.getState().lastError?.message).toContain("Failed to copy")
  })

  it("handles concurrent paste calls without throwing and keeps graph consistent", async () => {
    const store = createWorkflowStore()
    const payloadNodes: DomainWorkflowNodeDTO[] = [
      {
        id: "parallel-copy-set-variable",
        kind: "setVariable",
        position: { x: 10, y: 20 },
        label: "Set Variable",
        config: {
          variableName: "myVar",
          valueExpression: "{{ $input.item.json }}",
        },
      },
      {
        id: "parallel-copy-extractor",
        kind: "extractor",
        position: { x: 200, y: 20 },
        label: "Extractor",
        config: {
          tokenNumber: 0,
          extractExpression: "{{ $input.item.json }}",
          unlimited: false,
        },
      },
    ]
    const payload = exportSelectionClipboardJson(payloadNodes, [
      {
        id: "parallel-connection",
        sourceNodeId: "parallel-copy-set-variable",
        targetNodeId: "parallel-copy-extractor",
        sourceHandle: null,
        targetHandle: null,
      },
    ])
    clipboardReadTextMock.mockResolvedValue(payload)
    const beforeNodeCount = store.getState().history.present.nodes.length

    const [firstPasteResult, secondPasteResult] = await Promise.all([
      store.getState().pasteFromClipboard(),
      store.getState().pasteFromClipboard(),
    ])

    expect(firstPasteResult).toBe(true)
    expect(secondPasteResult).toBe(true)
    expect(store.getState().history.present.nodes.length).toBe(beforeNodeCount + 4)
    expect(store.getState().lastError).toBeNull()
  })

  it("rewrites pasted node references when labels are auto-incremented", async () => {
    const store = createWorkflowStore()
    const state = store.getState()
    state.addNode("setVariable", { x: 600, y: 160 })

    const payloadNodes: DomainWorkflowNodeDTO[] = [
      {
        id: "label-copy-set-variable",
        kind: "setVariable",
        position: { x: 20, y: 20 },
        label: "Set Variable",
        config: {
          variableName: "myVar",
          valueExpression: "{{ $input.item.json }}",
        },
      },
      {
        id: "label-copy-inline-expression",
        kind: "inlineExpression",
        position: { x: 200, y: 20 },
        label: "Keyword",
        config: {
          template: '{{ $node("Set Variable").item.json.myVar }}',
        },
      },
    ]
    const payload = exportSelectionClipboardJson(payloadNodes, [
      {
        id: "label-copy-connection",
        sourceNodeId: "label-copy-set-variable",
        targetNodeId: "label-copy-inline-expression",
        sourceHandle: null,
        targetHandle: null,
      },
    ])
    clipboardReadTextMock.mockResolvedValue(payload)

    const pasted = await store.getState().pasteFromClipboard()
    expect(pasted).toBe(true)

    const nextState = store.getState()
    const pastedNodes = nextState.history.present.nodes.filter((node) =>
      nextState.selectedNodeIds.includes(node.id)
    )
    const pastedInlineExpression = pastedNodes.find((node) => node.data.kind === "inlineExpression")

    expect(pastedInlineExpression?.data.config.template).toContain(
      '$node("Set Variable 2").item.json.myVar'
    )
  })

  it("does not commit graph for unchanged config updates", () => {
    const store = createWorkflowStore()
    const initialState = store.getState()
    const node = initialState.history.present.nodes.find((candidate) => candidate.data.kind === "trigger")
    if (!node) {
      throw new Error("trigger node fixture not found")
    }

    const previousHistory = initialState.history
    const previousNodesRef = initialState.history.present.nodes
    const previousNode = node
    const sameEventName =
      typeof node.data.config.eventName === "string"
        ? node.data.config.eventName
        : ""
    store.getState().updateNodeConfig(node.id, {
      kind: "trigger",
      key: "eventName",
      value: sameEventName,
    })

    const nextState = store.getState()
    expect(nextState.history).toBe(previousHistory)
    expect(nextState.history.present.nodes).toBe(previousNodesRef)
    const nextNode = nextState.history.present.nodes.find((candidate) => candidate.id === node.id)
    expect(nextNode).toBe(previousNode)
  })
})
