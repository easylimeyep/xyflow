// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { exportSelectionClipboardJson, parseSelectionClipboardJson } from "./mappers"
import { createWorkflowStore } from "./store"
import type { DomainWorkflowNodeDTO, WorkflowNode } from "./types"

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
    const triggerNode = state.history.present.nodes.find((node: WorkflowNode) => node.data.kind === "trigger")
    const transformNode = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!triggerNode || !transformNode) {
      throw new Error("fixture nodes not found")
    }

    state.setSelectedNodes([triggerNode.id, transformNode.id])
    const copied = await state.copySelectionToClipboard()

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
        id: "copy-code",
        kind: "code",
        position: { x: 240, y: 30 },
        label: "Code",
        config: {
          runtime: "js",
          code: "return { ok: true }",
        },
      },
    ]
    const payload = exportSelectionClipboardJson(payloadNodes, [
      {
        id: "copy-connection",
        sourceNodeId: "copy-set-variable",
        targetNodeId: "copy-code",
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
    expect(store.getState().lastError).toContain("workflow selection schema")
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
    const sameName = node.data.config.name
    store.getState().updateNodeConfigField(node.id, "name", sameName)

    const nextState = store.getState()
    expect(nextState.history).toBe(previousHistory)
    expect(nextState.history.present.nodes).toBe(previousNodesRef)
    const nextNode = nextState.history.present.nodes.find((candidate) => candidate.id === node.id)
    expect(nextNode).toBe(previousNode)
  })
})
