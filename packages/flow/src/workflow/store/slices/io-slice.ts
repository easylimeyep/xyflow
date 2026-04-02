import { createHistoryState } from "@workspace/store"
import { addEdge, type XYPosition } from "@xyflow/react"

import {
  refactorNodeReferencesInGraph,
  refactorVariableReferencesInGraph,
} from "../graph-refactors"
import {
  exportDomainJson,
  exportInternalJson,
  exportSelectionClipboardJson,
  parseInternalGraphJson,
  parseSelectionClipboardJson,
} from "../../mappers"
import {
  createWorkflowNode,
} from "../../node-registry/node-factory"
import { normalizeNodeConfig } from "../../node-registry/node-config-normalization"
import type { NodeKind } from "../../node-registry/registry"
import { createWorkflowError } from "../../types/errors"
import type { DomainWorkflowConnectionDTO, DomainWorkflowNodeDTO, WorkflowEdge, WorkflowNode } from "../../types/types"
import {
  asDomainConnectionDTO,
  asDomainNodeDTO,
  buildExpressionSlicePatch,
  cloneGraphState,
  commitGraphState,
  createUniqueJsIdentifier,
  deduplicateNodeLabels,
  getFallbackPasteAnchor,
  getSetVariableNames,
  readTextFromClipboard,
  writeTextToClipboard,
} from "../helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"

export const createIoSlice: WorkflowSliceCreator = (set, get) => ({
  copySelectionToClipboard: async () => {
    const state = get()
    const currentGraph = state.history.present
    const selectedNodeIdSet = new Set(state.selectedNodeIds)
    const selectedNodes = currentGraph.nodes.filter((node) =>
      selectedNodeIdSet.has(node.id)
    )
    if (selectedNodes.length === 0) {
      return false
    }

    const selectedConnections = currentGraph.edges
      .filter(
        (edge) =>
          selectedNodeIdSet.has(edge.source) && selectedNodeIdSet.has(edge.target)
      )
      .map(asDomainConnectionDTO)
    const payload = exportSelectionClipboardJson(
      selectedNodes.map(asDomainNodeDTO),
      selectedConnections
    )
    const copied = await writeTextToClipboard(payload)
    if (!copied) {
      set({ lastError: createWorkflowError("CLIPBOARD_WRITE_FAILED", "Failed to copy selected nodes.") })
      return false
    }

    set({ lastError: null })
    return true
  },
  pasteFromClipboard: async () => {
    const clipboardText = await readTextFromClipboard()
    if (!clipboardText) {
      set({ lastError: createWorkflowError("CLIPBOARD_EMPTY", "Clipboard is empty or unavailable.") })
      return false
    }
    const parsed = parseSelectionClipboardJson(clipboardText)
    if (!parsed.success || !parsed.value) {
      set({ lastError: createWorkflowError("IMPORT_INVALID_SCHEMA", parsed.error ?? "Clipboard JSON is not a workflow selection payload.") })
      return false
    }

    const currentGraph = get().history.present
    const anchor = get().lastPointerFlowPosition ?? getFallbackPasteAnchor(currentGraph.viewport)
    const usedLabels = new Set(currentGraph.nodes.map((n) => n.data.label.trim()).filter(Boolean))
    const usedVariableNames = getSetVariableNames(currentGraph.nodes)

    const { nodes: nextNodesWithRefactors, nodeIdMap } = buildPastedNodes(
      parsed.value.nodes,
      anchor,
      usedLabels,
      usedVariableNames
    )
    const nextEdges = buildPastedEdges(
      parsed.value.connections,
      nodeIdMap,
      new Map(nextNodesWithRefactors.map((n) => [n.id, n])),
      currentGraph.edges
    )

    commitGraphState(set, {
      ...currentGraph,
      nodes: [...currentGraph.nodes, ...nextNodesWithRefactors],
      edges: nextEdges,
    })
    const pastedNodeIds = nextNodesWithRefactors.map((node) => node.id)
    set((state) => ({
      selectedNodeIds: pastedNodeIds,
      history: {
        ...state.history,
        present: {
          ...state.history.present,
          nodes: projectSelectionToNodes(state.history.present.nodes, pastedNodeIds),
        },
      },
      lastError: null,
    }))
    return true
  },
  importFromJson: (rawJson) => {
    const parsed = parseInternalGraphJson(rawJson)
    if (!parsed.success || !parsed.value) {
      set({
        lastError: createWorkflowError("IMPORT_INVALID_SCHEMA", parsed.error ?? "Import failed due to invalid schema."),
      })
      return false
    }

    const importedGraph = cloneGraphState(parsed.value)
    const { nodes: nodesWithUniqueLabels, renames: labelRenames } =
      deduplicateNodeLabels(importedGraph.nodes, new Set<string>())
    let normalizedNodes = nodesWithUniqueLabels
    labelRenames.forEach((rename) => {
      normalizedNodes = refactorNodeReferencesInGraph(normalizedNodes, rename)
    })

    set((state) => ({
      history: createHistoryState({
        ...importedGraph,
        nodes: normalizedNodes,
      }),
      selectedNodeIds: [],
      nodeDragOriginGraph: null,
      lastError: null,
      ...buildExpressionSlicePatch(state, {
        ...importedGraph,
        nodes: normalizedNodes,
      }),
    }))
    return true
  },
  exportInternal: () => {
    return exportInternalJson(get().history.present)
  },
  exportDomain: () => {
    return exportDomainJson(get().history.present)
  },
})

function buildPastedNodes(
  parsedNodes: DomainWorkflowNodeDTO[],
  anchor: XYPosition,
  existingLabels: Set<string>,
  existingVariableNames: Set<string>
): { nodes: WorkflowNode[]; nodeIdMap: Map<string, string> } {
  const nodeIdMap = new Map<string, string>()
  const createdNodes: WorkflowNode[] = parsedNodes.map((nodeDto) => {
    const nextNode = createWorkflowNode(
      nodeDto.kind as NodeKind,
      { x: anchor.x + nodeDto.position.x, y: anchor.y + nodeDto.position.y },
      nodeDto.label
    )
    nextNode.data = {
      kind: nodeDto.kind,
      label: nodeDto.label,
      config: normalizeNodeConfig(nodeDto.kind as NodeKind, nodeDto.config),
    }
    nodeIdMap.set(nodeDto.id, nextNode.id)
    return nextNode
  })

  const { nodes: nodesWithUniqueLabels, renames: labelRenames } =
    deduplicateNodeLabels(createdNodes, existingLabels)

  const variableRenames: Array<{ sourceNodeLabel: string; oldName: string; newName: string }> = []
  const nodesWithUniqueVars = nodesWithUniqueLabels.map((node) => {
    if (node.data.kind !== "setVariable") return node
    const rawVariableName = node.data.config.variableName
    const previousName = typeof rawVariableName === "string" ? rawVariableName.trim() : ""
    const uniqueName = createUniqueJsIdentifier(previousName, existingVariableNames)
    if (previousName && previousName !== uniqueName) {
      variableRenames.push({ sourceNodeLabel: node.data.label, oldName: previousName, newName: uniqueName })
    }
    if (uniqueName === previousName) return node
    return { ...node, data: { ...node.data, config: { ...node.data.config, variableName: uniqueName } } }
  })

  let nodes = nodesWithUniqueVars
  labelRenames.forEach((rename) => { nodes = refactorNodeReferencesInGraph(nodes, rename) })
  variableRenames.forEach((rename) => { nodes = refactorVariableReferencesInGraph(nodes, rename) })

  return { nodes, nodeIdMap }
}

function buildPastedEdges(
  connections: DomainWorkflowConnectionDTO[],
  nodeIdMap: Map<string, string>,
  nodeById: Map<string, WorkflowNode>,
  existingEdges: WorkflowEdge[]
): WorkflowEdge[] {
  let nextEdges = [...existingEdges]
  connections.forEach((connection) => {
    const source = nodeIdMap.get(connection.sourceNodeId)
    const target = nodeIdMap.get(connection.targetNodeId)
    if (!source || !target) return
    const sourceNode = nodeById.get(source)
    const targetNode = nodeById.get(target)
    if (!sourceNode || !targetNode) return
    nextEdges = addEdge(
      {
        source,
        target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
        data: { sourceKind: sourceNode.data.kind, targetKind: targetNode.data.kind },
      },
      nextEdges
    ) as WorkflowEdge[]
  })
  return nextEdges
}
