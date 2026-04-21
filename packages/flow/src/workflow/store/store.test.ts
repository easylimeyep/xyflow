import { beforeEach, describe, expect, it, vi } from "vitest"

const { computeWorkflowAutoLayoutMock } = vi.hoisted(() => ({
  computeWorkflowAutoLayoutMock: vi.fn(),
}))

vi.mock("../layout", async () => {
  const actual = await vi.importActual<typeof import("../layout")>("../layout")
  return {
    ...actual,
    computeWorkflowAutoLayout: computeWorkflowAutoLayoutMock,
  }
})

import { exportDomainDto } from "../mappers"
import { DEFAULT_BRANCH_OPERATOR_OPTIONS } from "../types/types"
import {
  selectExpressionVariablesForNode,
  selectSelectedNode,
} from "./selectors"
import { createWorkflowStore } from "./store"
import type { DomainWorkflowDTO, WorkflowNode } from "../types/types"

let store: ReturnType<typeof createWorkflowStore>

function isRootKeywordNode(node: WorkflowNode): boolean {
  return node.data.kind === "inlineExpression" && node.data.config.isRoot === true
}

function findRootKeywordNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find((node) => isRootKeywordNode(node))
}

function findNonRootKeywordNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find(
    (node) => node.data.kind === "inlineExpression" && node.data.config.isRoot !== true
  )
}

describe("workflow store", () => {
  beforeEach(() => {
    computeWorkflowAutoLayoutMock.mockReset()
    store = createWorkflowStore()
  })

  it("initializes graph with root keyword and no trigger nodes", () => {
    const nodes = store.getState().history.present.nodes
    expect(nodes.some((node) => node.data.kind === "inlineExpression")).toBe(true)
    expect(nodes.some((node) => isRootKeywordNode(node))).toBe(true)
    expect(nodes.some((node) => node.data.kind === "trigger")).toBe(false)
  })

  it("adds node and updates history", () => {
    const before = store.getState().history.present.nodes.length
    store.getState().addNode("setVariable", { x: 50, y: 50 })
    const state = store.getState()

    expect(state.history.present.nodes.length).toBe(before + 1)
    expect(state.history.past.length).toBeGreaterThan(0)
  })

  it("supports undo and redo", () => {
    const workflowStore = store.getState()
    const before = workflowStore.history.present.nodes.length

    workflowStore.addNode("extractor", { x: 120, y: 100 })
    store.getState().undo()
    expect(store.getState().history.present.nodes.length).toBe(before)

    store.getState().redo()
    expect(store.getState().history.present.nodes.length).toBe(before + 1)
  })

  it("auto-layout commits as a single undoable history step", async () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const nextPosition = { x: targetNode.position.x + 240, y: targetNode.position.y + 40 }
    computeWorkflowAutoLayoutMock.mockResolvedValue({
      ...state.history.present,
      nodes: state.history.present.nodes.map((node) =>
        node.id === targetNode.id ? { ...node, position: nextPosition } : node
      ),
    })

    const didLayout = await state.autoLayout()

    expect(didLayout).toBe(true)
    expect(store.getState().history.present.nodes[0]?.position).toEqual(nextPosition)
    expect(store.getState().history.past.length).toBe(1)

    store.getState().undo()
    expect(store.getState().history.present.nodes[0]?.position).toEqual(targetNode.position)

    store.getState().redo()
    expect(store.getState().history.present.nodes[0]?.position).toEqual(nextPosition)
  })

  it("keeps graph stable and reports an error when auto-layout fails", async () => {
    const state = store.getState()
    const beforeGraph = state.history.present
    computeWorkflowAutoLayoutMock.mockRejectedValue(new Error("ELK exploded"))

    const didLayout = await state.autoLayout()

    expect(didLayout).toBe(false)
    expect(store.getState().history.present).toEqual(beforeGraph)
    expect(store.getState().history.past).toHaveLength(0)
    expect(store.getState().lastError?.code).toBe("AUTO_LAYOUT_FAILED")
    expect(store.getState().lastError?.message).toContain("ELK exploded")
  })

  it("keeps node add + measurement update as a single undo step", () => {
    const state = store.getState()
    const before = state.history.present.nodes.length

    state.addNode("extractor", { x: 120, y: 100 })
    const addedNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "extractor")
    if (!addedNode) {
      throw new Error("added node not found")
    }

    const historyAfterAdd = store.getState().history.past.length
    store.getState().onNodesChange([
      {
        id: addedNode.id,
        type: "dimensions",
        dimensions: { width: 260, height: 195 },
        setAttributes: true,
      },
    ])

    const measuredNode = store
      .getState()
      .history.present.nodes.find((node) => node.id === addedNode.id)
    expect(measuredNode?.measured).toEqual({ width: 260, height: 195 })
    expect(store.getState().history.past.length).toBe(historyAfterAdd)

    store.getState().undo()
    expect(store.getState().history.present.nodes.length).toBe(before)
  })

  it("imports workflow from domain json", () => {
    const exportDomain = store.getState().exportDomain()
    const imported = store.getState().importFromJson(
      JSON.stringify(exportDomain, null, 2)
    )

    expect(imported).toBe(true)
    expect(store.getState().lastError).toBeNull()
  })

  it("applies runtime importDomain mapper before graph conversion", () => {
    const runtimeStore = createWorkflowStore({
      runtime: {
        importDomain: {
          mapper: (payload) => ({
            ...payload,
            name: "mapped-import",
            metadata: {
              ...payload.metadata,
              importedByMapper: true,
            },
            nodes: payload.nodes.map((node, index) =>
              index === 0
                ? {
                    ...node,
                    label: "Mapped Root",
                  }
                : node
            ),
          }),
        },
      },
    })

    const imported = runtimeStore
      .getState()
      .importFromJson(JSON.stringify(store.getState().exportDomain(), null, 2))

    expect(imported).toBe(true)
    expect(runtimeStore.getState().lastError).toBeNull()
    expect(runtimeStore.getState().history.present.document.name).toBe(
      "mapped-import"
    )
    expect(runtimeStore.getState().history.present.document.metadata).toMatchObject(
      {
        importedByMapper: true,
      }
    )
    expect(runtimeStore.getState().history.present.nodes[0]?.data.label).toBe(
      "Mapped Root"
    )
  })

  it("keeps default exportDomain output when runtime mapper is not provided", () => {
    const expected = exportDomainDto(store.getState().history.present)

    expect(store.getState().exportDomain()).toEqual(expected)
  })

  it("applies runtime exportDomain mapper after base payload generation", () => {
    const runtimeStore = createWorkflowStore({
      runtime: {
        exportDomain: {
          mapper: (payload) => ({
            ...payload,
            metadata: {
              ...payload.metadata,
              customExport: true,
            },
          }),
        },
      },
    })

    const basePayload = exportDomainDto(runtimeStore.getState().history.present)

    expect(runtimeStore.getState().exportDomain()).toEqual(
      {
        ...basePayload,
        metadata: {
          ...basePayload.metadata,
          customExport: true,
        },
      }
    )
  })

  it("uses the default branch operator catalog when runtime branch operators are omitted", () => {
    expect(store.getState().runtime.branch?.operators).toEqual(
      DEFAULT_BRANCH_OPERATOR_OPTIONS
    )
  })

  it("normalizes custom runtime branch operators before storing them", () => {
    const runtimeStore = createWorkflowStore({
      runtime: {
        branch: {
          operators: [
            { id: "  matches  ", value: "  Matches  ", requiresTarget: 1 as never },
            { id: "matches", value: "Duplicate", requiresTarget: false },
            { id: "missing", value: "Is Missing", requiresTarget: false },
          ],
        },
      },
    })

    expect(runtimeStore.getState().runtime.branch?.operators).toEqual([
      { id: "matches", value: "Matches", requiresTarget: true },
      { id: "missing", value: "Is Missing", requiresTarget: false },
    ])
  })

  it("falls back to the default branch operator catalog when runtime branch operators are invalid", () => {
    const runtimeStore = createWorkflowStore({
      runtime: {
        branch: {
          operators: [
            { id: " ", value: "Missing id", requiresTarget: true },
            { id: "missing-value", value: " ", requiresTarget: false },
          ],
        },
      },
    })

    expect(runtimeStore.getState().runtime.branch?.operators).toEqual(
      DEFAULT_BRANCH_OPERATOR_OPTIONS
    )
  })

  it("sets error for invalid import json", () => {
    const imported = store.getState().importFromJson("{\"bad\":true}")

    expect(imported).toBe(false)
    expect(store.getState().lastError?.message).toContain("domain workflow schema")
  })

  it("rejects invalid runtime importDomain mapper output", () => {
    const runtimeStore = createWorkflowStore({
      runtime: {
        importDomain: {
          mapper: (payload): DomainWorkflowDTO => ({
            ...payload,
            nodes: payload.nodes.map((node, index) =>
              index === 0
                ? {
                    id: node.id,
                    position: node.position,
                    label: node.label,
                    config: node.config,
                    kind: "not-a-real-kind" as never,
                  }
                : node
            ),
          }),
        },
      },
    })

    const beforeGraph = runtimeStore.getState().history.present
    const imported = runtimeStore
      .getState()
      .importFromJson(JSON.stringify(store.getState().exportDomain(), null, 2))

    expect(imported).toBe(false)
    expect(runtimeStore.getState().lastError?.message).toContain(
      "invalid schema"
    )
    expect(runtimeStore.getState().history.present).toEqual(beforeGraph)
  })

  it("rejects invalid connections and keeps graph stable", () => {
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const trigger = findRootKeywordNode(store.getState().history.present.nodes)
    const inlineNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    if (!trigger || !inlineNode) {
      throw new Error("fixture nodes not found")
    }

    const edgeCount = store.getState().history.present.edges.length
    // Root keyword cannot accept incoming connections.
    state.onConnect({ source: inlineNode.id, target: trigger.id })
    const nextState = store.getState()

    expect(nextState.history.present.edges.length).toBe(edgeCount)
    expect(nextState.lastError?.message).toContain("Root Keyword")
  })

  it("creates valid connections and clears previous errors", () => {
    const state = store.getState()
    state.addNode("extractor", { x: 480, y: 120 })
    const trigger = findRootKeywordNode(state.history.present.nodes)
    const extractor = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "extractor")
    if (!trigger || !extractor) {
      throw new Error("fixture nodes not found")
    }

    // Root keyword cannot accept incoming connections.
    state.onConnect({ source: extractor.id, target: trigger.id })
    expect(store.getState().lastError?.message).toContain("Root Keyword")

    const beforeEdgeCount = store.getState().history.present.edges.length
    store.getState().onConnect({ source: trigger.id, target: extractor.id })
    const nextState = store.getState()

    expect(nextState.history.present.edges.length).toBe(beforeEdgeCount + 1)
    expect(nextState.lastError).toBeNull()
  })

  it("undoes and redoes a created connection", () => {
    const state = store.getState()
    state.addNode("extractor", { x: 480, y: 120 })
    const trigger = findRootKeywordNode(store.getState().history.present.nodes)
    const extractor = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "extractor")
    if (!trigger || !extractor) {
      throw new Error("fixture nodes not found")
    }

    const basePastLength = store.getState().history.past.length
    store.getState().onConnect({ source: trigger.id, target: extractor.id })
    const afterConnectState = store.getState()

    expect(afterConnectState.history.present.edges).toHaveLength(1)
    expect(afterConnectState.history.past.length).toBe(basePastLength + 1)

    store.getState().undo()
    const afterUndoState = store.getState()
    expect(afterUndoState.history.present.edges).toHaveLength(0)

    store.getState().redo()
    const afterRedoState = store.getState()
    expect(afterRedoState.history.present.edges).toHaveLength(1)
    expect(
      afterRedoState.history.present.edges.some(
        (edge) => edge.source === trigger.id && edge.target === extractor.id
      )
    ).toBe(true)
  })

  it("updates label and config fields as committed history changes", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const initialPastLength = state.history.past.length
    state.updateNodeLabel(targetNode.id, "Updated label")
    state.updateNodeConfig(targetNode.id, {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ updated-value }}"],
    })

    const nextState = store.getState()
    const updatedNode = nextState.history.present.nodes.find((node) => node.id === targetNode.id)

    expect(updatedNode?.data.label).toBe("Updated label")
    expect(updatedNode?.data.config.template).toEqual(["{{ updated-value }}"])
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
    const signatureAfterTransientDrag = store.getState().expressionStructuralSignature
    const versionAfterTransientDrag = store.getState().expressionStructuralVersion

    store.getState().onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: 40, y: 60 },
        dragging: false,
      },
    ])
    expect(store.getState().history.past.length).toBe(basePastLength + 1)
    expect(store.getState().expressionStructuralSignature).toBe(
      signatureAfterTransientDrag
    )
    expect(store.getState().expressionStructuralVersion).toBe(versionAfterTransientDrag)
  })

  it("undoes node drag from the first hotkey press", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const initialPosition = { ...targetNode.position }
    const basePastLength = state.history.past.length

    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: initialPosition.x + 60, y: initialPosition.y + 40 },
        dragging: true,
      },
    ])

    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: initialPosition.x + 60, y: initialPosition.y + 40 },
        dragging: false,
      },
    ])

    expect(store.getState().history.past.length).toBe(basePastLength + 1)

    store.getState().undo()
    const nodeAfterUndo = store
      .getState()
      .history.present.nodes.find((node) => node.id === targetNode.id)
    expect(nodeAfterUndo?.position).toEqual(initialPosition)
  })

  it("reapplies committed node drag with redo", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const initialPosition = { ...targetNode.position }
    const draggedPosition = {
      x: initialPosition.x + 60,
      y: initialPosition.y + 40,
    }

    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: draggedPosition,
        dragging: true,
      },
    ])
    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: draggedPosition,
        dragging: false,
      },
    ])

    store.getState().undo()
    expect(
      store.getState().history.present.nodes.find((node) => node.id === targetNode.id)?.position
    ).toEqual(initialPosition)

    store.getState().redo()
    expect(
      store.getState().history.present.nodes.find((node) => node.id === targetNode.id)?.position
    ).toEqual(draggedPosition)
  })

  it("walks through multiple committed drag positions with undo and redo", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const initialPosition = { ...targetNode.position }
    const middlePosition = {
      x: initialPosition.x + 40,
      y: initialPosition.y + 20,
    }
    const finalPosition = {
      x: initialPosition.x + 100,
      y: initialPosition.y + 60,
    }

    state.onNodesChange([
      { id: targetNode.id, type: "position", position: middlePosition, dragging: true },
    ])
    state.onNodesChange([
      { id: targetNode.id, type: "position", position: middlePosition, dragging: false },
    ])
    state.onNodesChange([
      { id: targetNode.id, type: "position", position: finalPosition, dragging: true },
    ])
    state.onNodesChange([
      { id: targetNode.id, type: "position", position: finalPosition, dragging: false },
    ])

    store.getState().undo()
    expect(
      store.getState().history.present.nodes.find((node) => node.id === targetNode.id)?.position
    ).toEqual(middlePosition)

    store.getState().undo()
    expect(
      store.getState().history.present.nodes.find((node) => node.id === targetNode.id)?.position
    ).toEqual(initialPosition)

    store.getState().redo()
    expect(
      store.getState().history.present.nodes.find((node) => node.id === targetNode.id)?.position
    ).toEqual(middlePosition)

    store.getState().redo()
    expect(
      store.getState().history.present.nodes.find((node) => node.id === targetNode.id)?.position
    ).toEqual(finalPosition)
  })

  it("keeps selected node highlight and panel selection in sync after undo/redo", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    state.setSelectedNode(targetNode.id)
    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: targetNode.position.x + 80, y: targetNode.position.y + 40 },
        dragging: true,
      },
    ])
    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: targetNode.position.x + 80, y: targetNode.position.y + 40 },
        dragging: false,
      },
    ])

    store.getState().undo()
    const stateAfterUndo = store.getState()
    const selectedNodeAfterUndo = stateAfterUndo.history.present.nodes.find(
      (node) => node.id === targetNode.id
    )
    expect(stateAfterUndo.selectedNodeIds).toEqual([targetNode.id])
    expect(selectedNodeAfterUndo?.selected).toBe(true)
    expect(selectSelectedNode(stateAfterUndo)?.id).toBe(targetNode.id)

    store.getState().redo()
    const stateAfterRedo = store.getState()
    const selectedNodeAfterRedo = stateAfterRedo.history.present.nodes.find(
      (node) => node.id === targetNode.id
    )
    expect(stateAfterRedo.selectedNodeIds).toEqual([targetNode.id])
    expect(selectedNodeAfterRedo?.selected).toBe(true)
    expect(selectSelectedNode(stateAfterRedo)?.id).toBe(targetNode.id)
  })

  it("keeps expression catalog selector value stable across drag-only updates", () => {
    const state = store.getState()
    const targetNode = findRootKeywordNode(state.history.present.nodes)
    if (!targetNode) {
      throw new Error("root keyword fixture node not found")
    }

    const beforeCatalog = selectExpressionVariablesForNode(
      store.getState(),
      targetNode.id
    )

    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: targetNode.position.x + 40, y: targetNode.position.y + 30 },
        dragging: true,
      },
    ])

    const afterTransientCatalog = selectExpressionVariablesForNode(
      store.getState(),
      targetNode.id
    )
    expect(afterTransientCatalog).toEqual(beforeCatalog)

    store.getState().onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: targetNode.position.x + 80, y: targetNode.position.y + 60 },
        dragging: false,
      },
    ])
    const afterCommitCatalog = selectExpressionVariablesForNode(
      store.getState(),
      targetNode.id
    )
    expect(afterCommitCatalog).toEqual(afterTransientCatalog)

    store.getState().updateNodeLabel(targetNode.id, "Keyword changed")
    const afterStructuralChangeCatalog = selectExpressionVariablesForNode(
      store.getState(),
      targetNode.id
    )
    expect(afterStructuralChangeCatalog).not.toBe(afterCommitCatalog)
  })

  it("keeps cache scoped per store instance", () => {
    const firstStore = createWorkflowStore()
    const secondStore = createWorkflowStore()

    firstStore.getState().addNode("setVariable", { x: 320, y: 80 })
    firstStore.getState().addNode("inlineExpression", { x: 620, y: 80 })
    const firstInlineNode = findNonRootKeywordNode(firstStore.getState().history.present.nodes)
    const firstSetVariable = firstStore
      .getState()
      .history.present.nodes.find((node) => node.data.kind === "setVariable")
    if (!firstInlineNode || !firstSetVariable) {
      throw new Error("first store fixtures not found")
    }
    firstStore.getState().onConnect({ source: firstSetVariable.id, target: firstInlineNode.id })

    const firstCatalog = selectExpressionVariablesForNode(firstStore.getState(), firstInlineNode.id)
    const secondInlineNode = findRootKeywordNode(secondStore.getState().history.present.nodes)
    if (!secondInlineNode) {
      throw new Error("second store root fixture not found")
    }
    const secondCatalog = selectExpressionVariablesForNode(secondStore.getState(), secondInlineNode.id)

    expect(firstCatalog).not.toBe(secondCatalog)
    expect(firstCatalog.some((option) => option.value === "myVar")).toBe(true)
    expect(secondCatalog).toEqual([])
  })

  it("increments structural version only on structural graph changes", () => {
    const state = store.getState()
    const targetNode = state.history.present.nodes[0]
    if (!targetNode) {
      throw new Error("fixture node not found")
    }

    const initialVersion = store.getState().expressionStructuralVersion

    state.setViewport({ x: 10, y: 20, zoom: 1.2 })
    expect(store.getState().expressionStructuralVersion).toBe(initialVersion)

    state.onNodesChange([
      {
        id: targetNode.id,
        type: "position",
        position: { x: targetNode.position.x + 10, y: targetNode.position.y + 10 },
        dragging: true,
      },
    ])
    expect(store.getState().expressionStructuralVersion).toBe(initialVersion)

    state.updateNodeConfig(targetNode.id, {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ renamed }}"],
    })
    expect(store.getState().expressionStructuralVersion).toBe(initialVersion + 1)
  })

  it("commits structural edge changes to history", () => {
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const inlineNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    const trigger = findRootKeywordNode(store.getState().history.present.nodes)
    if (!trigger || !inlineNode) throw new Error("fixture nodes not found")
    store.getState().onConnect({ source: trigger.id, target: inlineNode.id })
    const edge = store.getState().history.present.edges[0]
    if (!edge) throw new Error("fixture edge not found")

    const basePastLength = store.getState().history.past.length

    store.getState().onEdgesChange([{ type: "remove", id: edge.id }])

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

  it("does not seed undo history when initial nodes receive measurement updates", () => {
    const state = store.getState()
    const initialNode = state.history.present.nodes[0]
    if (!initialNode) {
      throw new Error("initial node not found")
    }

    const basePastLength = state.history.past.length
    state.onNodesChange([
      {
        id: initialNode.id,
        type: "dimensions",
        dimensions: { width: 260, height: 116 },
        setAttributes: true,
      },
    ])

    expect(store.getState().history.past.length).toBe(basePastLength)
    expect(store.getState().history.future).toHaveLength(0)
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
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const firstNode = store.getState().history.present.nodes[0]
    const secondNode = store.getState().history.present.nodes[1]
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
    const sourceNode = findRootKeywordNode(state.history.present.nodes)
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

  it("undoes add-node and connect steps in reverse order", () => {
    const state = store.getState()
    const initialNodeCount = state.history.present.nodes.length
    const initialEdgeCount = state.history.present.edges.length

    state.addNode("extractor", { x: 480, y: 120 })
    const trigger = findRootKeywordNode(store.getState().history.present.nodes)
    const extractor = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "extractor")
    if (!trigger || !extractor) {
      throw new Error("fixture nodes not found")
    }

    store.getState().onConnect({ source: trigger.id, target: extractor.id })
    expect(store.getState().history.present.nodes.length).toBe(initialNodeCount + 1)
    expect(store.getState().history.present.edges.length).toBe(initialEdgeCount + 1)

    store.getState().undo()
    expect(store.getState().history.present.nodes.length).toBe(initialNodeCount + 1)
    expect(store.getState().history.present.edges.length).toBe(initialEdgeCount)

    store.getState().undo()
    expect(store.getState().history.present.nodes.length).toBe(initialNodeCount)
    expect(store.getState().history.present.edges.length).toBe(initialEdgeCount)

    store.getState().redo()
    expect(store.getState().history.present.nodes.length).toBe(initialNodeCount + 1)
    expect(store.getState().history.present.edges.length).toBe(initialEdgeCount)

    store.getState().redo()
    expect(store.getState().history.present.nodes.length).toBe(initialNodeCount + 1)
    expect(store.getState().history.present.edges.length).toBe(initialEdgeCount + 1)
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
    store.getState().confirmQuickAddNode("extractor")
    const edgeFromTrue = store.getState().history.present.edges.find(
      (edge) => edge.source === branchNode.id && edge.sourceHandle === "branch-true"
    )
    expect(edgeFromTrue).toBeDefined()

    store.getState().startQuickAddFromOutput(branchNode.id, "branch-false")
    store.getState().confirmQuickAddNode("setVariable")
    const edgeFromFalse = store.getState().history.present.edges.find(
      (edge) => edge.source === branchNode.id && edge.sourceHandle === "branch-false"
    )
    expect(edgeFromFalse).toBeDefined()
  })

  it("restores quick-add node and edge in a single undo after node deletion", () => {
    const state = store.getState()
    const sourceNode = findRootKeywordNode(state.history.present.nodes)
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
    const sourceNode = findRootKeywordNode(state.history.present.nodes)
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
    state.addNode("inlineExpression", { x: 360, y: 80 })
    state.addNode("extractor", { x: 700, y: 120 })

    const inlineNode = store
      .getState()
      .history.present.nodes.find(
        (node: WorkflowNode) =>
          node.data.kind === "inlineExpression" && node.data.config.isRoot !== true
      )
    const extractorNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "extractor")
    if (!inlineNode || !extractorNode) {
      throw new Error("fixture nodes not found")
    }

    store.getState().onConnect({ source: inlineNode.id, target: extractorNode.id })

    const beforeDeleteState = store.getState()
    const pastBeforeDelete = beforeDeleteState.history.past.length
    const nodesBeforeDelete = beforeDeleteState.history.present.nodes.length
    const edgesBeforeDelete = beforeDeleteState.history.present.edges.length

    const removedNodeIds = new Set([inlineNode.id, extractorNode.id])
    const removedEdgeIds = beforeDeleteState.history.present.edges
      .filter((edge) => removedNodeIds.has(edge.source) || removedNodeIds.has(edge.target))
      .map((edge) => edge.id)

    store.getState().onNodesChange([
      { id: inlineNode.id, type: "remove" },
      { id: extractorNode.id, type: "remove" },
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
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const triggerNode = findRootKeywordNode(store.getState().history.present.nodes)
    const inlineNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    if (!triggerNode || !inlineNode) {
      throw new Error("fixture nodes not found")
    }
    // Occupy root keyword output so quick add is blocked
    store.getState().onConnect({ source: triggerNode.id, target: inlineNode.id })

    state.startQuickAddFromOutput(triggerNode.id, null)
    expect(store.getState().quickAddPending).toBeNull()

    state.startQuickAddFromOutput(inlineNode.id, null)
    expect(store.getState().quickAddPending).toEqual({
      sourceNodeId: inlineNode.id,
      sourceHandle: null,
    })
    state.cancelQuickAdd()
    expect(store.getState().quickAddPending).toBeNull()
  })

  it("splits edge into source->new and new->target in one history step", () => {
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const triggerNode = findRootKeywordNode(store.getState().history.present.nodes)
    const inlineNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    if (!triggerNode || !inlineNode) throw new Error("fixture nodes not found")
    store.getState().onConnect({ source: triggerNode.id, target: inlineNode.id })
    const initialEdge = store.getState().history.present.edges[0]
    if (!initialEdge) {
      throw new Error("fixture edge not found")
    }

    const targetBefore = store.getState().history.present.nodes.find((node) => node.id === initialEdge.target)
    if (!targetBefore) {
      throw new Error("target node not found")
    }
    const basePastLength = store.getState().history.past.length

    state.startEdgeInsertFromEdge(initialEdge.id)
    expect(store.getState().edgeInsertPending).toEqual({ edgeId: initialEdge.id })

    state.confirmEdgeInsertNode("branch")

    const nextState = store.getState()
    const insertedNode = nextState.history.present.nodes.find((node) => node.data.kind === "branch")
    if (!insertedNode) {
      throw new Error("inserted node not found")
    }

    const nextEdges = nextState.history.present.edges
    expect(nextEdges.some((edge) => edge.id === initialEdge.id)).toBe(false)
    expect(nextEdges.some((edge) => edge.source === initialEdge.source && edge.target === insertedNode.id)).toBe(
      true
    )
    expect(nextEdges.some((edge) => edge.source === insertedNode.id && edge.target === initialEdge.target)).toBe(
      true
    )
    expect(nextState.history.past.length).toBe(basePastLength + 1)

    const targetAfter = nextState.history.present.nodes.find((node) => node.id === initialEdge.target)
    expect(targetAfter?.position.x).toBeGreaterThan(targetBefore.position.x)
  })

  it("preserves sourceHandle and targetHandle when split succeeds", () => {
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const triggerNode = findRootKeywordNode(store.getState().history.present.nodes)
    const transformNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    if (!triggerNode || !transformNode) {
      throw new Error("fixture nodes not found")
    }

    state.onConnect({
      source: triggerNode.id,
      target: transformNode.id,
      sourceHandle: "source-handle-a",
      targetHandle: "target-handle-b",
    })
    const createdEdge = store
      .getState()
      .history.present.edges.find(
        (edge) =>
          edge.source === triggerNode.id &&
          edge.target === transformNode.id &&
          edge.sourceHandle === "source-handle-a" &&
          edge.targetHandle === "target-handle-b"
      )
    if (!createdEdge) {
      throw new Error("fixture handled edge not found")
    }

    state.startEdgeInsertFromEdge(createdEdge.id)
    state.confirmEdgeInsertNode("branch")

    const nextState = store.getState()
    const insertedNode = nextState.history.present.nodes.find((node) => node.data.kind === "branch")
    if (!insertedNode) {
      throw new Error("inserted node not found")
    }

    const sourceLeg = nextState.history.present.edges.find(
      (edge) => edge.source === triggerNode.id && edge.target === insertedNode.id
    )
    const targetLeg = nextState.history.present.edges.find(
      (edge) => edge.source === insertedNode.id && edge.target === transformNode.id
    )

    expect(sourceLeg?.sourceHandle).toBe("source-handle-a")
    expect(targetLeg?.targetHandle).toBe("target-handle-b")
  })

  it("undoes and redoes edge insert as a single history step", () => {
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    const triggerNode = findRootKeywordNode(store.getState().history.present.nodes)
    const inlineNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    if (!triggerNode || !inlineNode) {
      throw new Error("fixture nodes not found")
    }

    store.getState().onConnect({ source: triggerNode.id, target: inlineNode.id })
    const initialEdge = store.getState().history.present.edges[0]
    if (!initialEdge) {
      throw new Error("fixture edge not found")
    }

    const beforeInsertState = store.getState()
    state.startEdgeInsertFromEdge(initialEdge.id)
    state.confirmEdgeInsertNode("branch")

    const insertedState = store.getState()
    expect(insertedState.history.present.nodes.length).toBe(
      beforeInsertState.history.present.nodes.length + 1
    )
    expect(insertedState.history.present.edges.length).toBe(
      beforeInsertState.history.present.edges.length + 1
    )

    store.getState().undo()
    const afterUndoState = store.getState()
    expect(afterUndoState.history.present.nodes.length).toBe(
      beforeInsertState.history.present.nodes.length
    )
    expect(afterUndoState.history.present.edges.length).toBe(
      beforeInsertState.history.present.edges.length
    )
    expect(
      afterUndoState.history.present.edges.some((edge) => edge.id === initialEdge.id)
    ).toBe(true)

    store.getState().redo()
    const afterRedoState = store.getState()
    expect(afterRedoState.history.present.nodes.length).toBe(
      beforeInsertState.history.present.nodes.length + 1
    )
    expect(afterRedoState.history.present.edges.length).toBe(
      beforeInsertState.history.present.edges.length + 1
    )
    expect(
      afterRedoState.history.present.edges.some((edge) => edge.id === initialEdge.id)
    ).toBe(false)
  })

  it("fails edge insert when inserted->target leg is invalid", () => {
    const state = store.getState()
    state.addNode("inlineExpression", { x: 360, y: 80 })
    state.addNode("setVariable", { x: 720, y: 80 })
    const inlineNode = findNonRootKeywordNode(store.getState().history.present.nodes)
    const setVariableNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "setVariable")
    if (!inlineNode || !setVariableNode) {
      throw new Error("fixture nodes not found")
    }

    store.getState().onConnect({ source: inlineNode.id, target: setVariableNode.id })
    const edgeToSplit = store
      .getState()
      .history.present.edges.find((edge) => edge.source === inlineNode.id && edge.target === setVariableNode.id)
    if (!edgeToSplit) {
      throw new Error("edge to split not found")
    }

    // Result has no allowedTargets, so inserted->target is invalid and insertion must fail.
    store.getState().startEdgeInsertFromEdge(edgeToSplit.id)
    store.getState().confirmEdgeInsertNode("result")

    const nextState = store.getState()
    expect(nextState.edgeInsertPending).toBeNull()
    expect(nextState.lastError?.code).toBe("EDGE_INSERT_FAILED")
    expect(nextState.history.present.edges.some((edge) => edge.id === edgeToSplit.id)).toBe(
      true
    )
  })

  it("refactors plain variable references when setVariable variableName is renamed", () => {
    const state = store.getState()
    state.addNode("setVariable", { x: 600, y: 80 })
    state.addNode("inlineExpression", { x: 900, y: 80 })

    const setVariableNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "setVariable")
    const inlineExpressionNode = store
      .getState()
      .history.present.nodes.find(
        (node: WorkflowNode) =>
          node.data.kind === "inlineExpression" && node.data.config.isRoot !== true
      )
    if (!setVariableNode || !inlineExpressionNode) {
      throw new Error("set variable fixture nodes not found")
    }
    const initialVariableName = String(setVariableNode.data.config.variableName ?? "")

    state.updateNodeConfig(inlineExpressionNode.id, {
      kind: "inlineExpression",
      key: "template",
      value: [`{{ ${initialVariableName} }}`],
    })

    state.updateNodeConfig(setVariableNode.id, {
      kind: "setVariable",
      key: "variableName",
      value: "newName",
    })

    const nextState = store.getState()
    const nextSetVariableNode = nextState.history.present.nodes.find(
      (node) => node.id === setVariableNode.id
    )
    const nextInlineExpressionNode = nextState.history.present.nodes.find(
      (node) => node.id === inlineExpressionNode.id
    )

    expect(nextSetVariableNode?.data.config.variableName).toBe("newName")
    expect(nextSetVariableNode?.data.label).toBe(setVariableNode.data.label)
    expect(nextInlineExpressionNode?.data.config.template).toEqual(["{{ newName }}"])
  })

  it("refactors plain variable references when extractor Label is renamed via config", () => {
    const state = store.getState()
    state.addNode("extractor", { x: 600, y: 80 })
    state.addNode("inlineExpression", { x: 900, y: 80 })

    const extractorNode = store
      .getState()
      .history.present.nodes.find((node: WorkflowNode) => node.data.kind === "extractor")
    const inlineExpressionNode = store
      .getState()
      .history.present.nodes.find(
        (node: WorkflowNode) =>
          node.data.kind === "inlineExpression" && node.data.config.isRoot !== true
      )
    if (!extractorNode || !inlineExpressionNode) {
      throw new Error("extractor fixture nodes not found")
    }

    state.updateNodeConfig(extractorNode.id, {
      kind: "extractor",
      key: "extractExpression",
      value: "oldName",
    })
    state.updateNodeConfig(inlineExpressionNode.id, {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ oldName }}"],
    })

    state.updateNodeConfig(extractorNode.id, {
      kind: "extractor",
      key: "extractExpression",
      value: "newName",
    })

    const nextState = store.getState()
    const nextExtractorNode = nextState.history.present.nodes.find((node) => node.id === extractorNode.id)
    const nextInlineExpressionNode = nextState.history.present.nodes.find(
      (node) => node.id === inlineExpressionNode.id
    )

    expect(nextExtractorNode?.data.config.extractExpression).toBe("newName")
    expect(nextExtractorNode?.data.label).toBe(extractorNode.data.label)
    expect(nextInlineExpressionNode?.data.config.template).toEqual(["{{ newName }}"])
  })

  it("enforces label uniqueness so two setVariable nodes cannot have the same label", () => {
    const state = store.getState()
    state.addNode("setVariable", { x: 600, y: 80 })
    state.addNode("setVariable", { x: 900, y: 80 })
    const setVariableNodes = store
      .getState()
      .history.present.nodes.filter((node) => node.data.kind === "setVariable")
    const firstNode = setVariableNodes[0]
    const secondNode = setVariableNodes[1]
    if (!firstNode || !secondNode) {
      throw new Error("setVariable fixtures not found")
    }

    // Labels are auto-deduplicated: first is "Setter", second is "Setter 2"
    expect(firstNode.data.label).not.toBe(secondNode.data.label)
  })

  it("auto-increments duplicate labels when adding same node kind", () => {
    const state = store.getState()
    state.addNode("extractor", { x: 700, y: 80 })
    state.addNode("extractor", { x: 900, y: 80 })

    const extractorLabels = store
      .getState()
      .history.present.nodes.filter((node) => node.data.kind === "extractor")
      .map((node) => node.data.label)
      .sort()

    expect(extractorLabels).toEqual(["Extractor", "Extractor2"])
  })

  it("renames extractor label with auto-increment and refactors plain variable references", () => {
    const state = store.getState()
    state.addNode("extractor", { x: 360, y: 80 })
    state.addNode("extractor", { x: 560, y: 80 })
    const extractorNodes = store
      .getState()
      .history.present.nodes.filter((node: WorkflowNode) => node.data.kind === "extractor")
    const firstExtractor = extractorNodes[0]
    const secondExtractor = extractorNodes[1]
    if (!firstExtractor || !secondExtractor) {
      throw new Error("extractor fixture nodes not found")
    }

    state.addNode("inlineExpression", { x: 900, y: 80 })
    const inlineExpressionNode = store
      .getState()
      .history.present.nodes.find(
        (node: WorkflowNode) =>
          node.data.kind === "inlineExpression" && node.data.config.isRoot !== true
      )
    if (!inlineExpressionNode) {
      throw new Error("inline expression fixture not found")
    }

    state.updateNodeConfig(inlineExpressionNode.id, {
      kind: "inlineExpression",
      key: "template",
      value: [`{{ ${firstExtractor.data.label} }}`],
    })
    // Rename firstExtractor to secondExtractor's label — triggers auto-increment
    state.updateNodeLabel(firstExtractor.id, secondExtractor.data.label)

    const nextState = store.getState()
    const nextFirstExtractor = nextState.history.present.nodes.find((node) => node.id === firstExtractor.id)
    const nextInlineExpressionNode = nextState.history.present.nodes.find(
      (node) => node.id === inlineExpressionNode.id
    )

    // Label should be auto-incremented to avoid conflict
    expect(nextFirstExtractor?.data.label).not.toBe(firstExtractor.data.label)
    // Template should be refactored to use the new label
    expect(nextInlineExpressionNode?.data.config.template).toEqual([
      `{{ ${nextFirstExtractor?.data.label} }}`,
    ])
  })
})
