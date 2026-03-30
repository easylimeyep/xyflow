import { createHistoryState } from "@workspace/store"
import { addEdge } from "@xyflow/react"

import { refactorVariableReferencesInGraph } from "../../expression/refactor/refactor"
import {
  exportDomainJson,
  exportInternalJson,
  exportSelectionClipboardJson,
  parseInternalGraphJson,
  parseSelectionClipboardJson,
} from "../../mappers"
import {
  createWorkflowNode,
  normalizeNodeConfig,
} from "../../node-registry/node-registry"
import { createWorkflowError } from "../../types/errors"
import type { WorkflowEdge, WorkflowNode } from "../../types/types"
import {
  asDomainConnectionDTO,
  asDomainNodeDTO,
  cloneGraphState,
  commitGraphState,
  createUniqueJsIdentifier,
  createUniqueLabel,
  getFallbackPasteAnchor,
  getSetVariableNames,
  readTextFromClipboard,
  writeTextToClipboard,
} from "../helpers"
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
      set({
        lastError: createWorkflowError("IMPORT_INVALID_SCHEMA", parsed.error ?? "Clipboard JSON is not a workflow selection payload."),
      })
      return false
    }

    const currentGraph = get().history.present
    const anchor =
      get().lastPointerFlowPosition ?? getFallbackPasteAnchor(currentGraph.viewport)
    const usedLabels = new Set(
      currentGraph.nodes
        .map((node) => node.data.label.trim())
        .filter((label) => label.length > 0)
    )
    const usedVariableNames = getSetVariableNames(currentGraph.nodes)
    const nodeIdMap = new Map<string, string>()
    const variableRenames: Array<{
      sourceNodeId: string
      oldName: string
      newName: string
    }> = []

    const nextNodes: WorkflowNode[] = parsed.value.nodes.map((nodeDto) => {
      const uniqueLabel = createUniqueLabel(nodeDto.label, usedLabels)
      const nextNode = createWorkflowNode(
        nodeDto.kind,
        {
          x: anchor.x + nodeDto.position.x,
          y: anchor.y + nodeDto.position.y,
        },
        uniqueLabel
      )
      nextNode.data = {
        kind: nodeDto.kind,
        label: uniqueLabel,
        config: normalizeNodeConfig(nodeDto.kind, nodeDto.config),
      }

      if (nodeDto.kind === "setVariable") {
        const rawVariableName = nextNode.data.config.variableName
        const previousName =
          typeof rawVariableName === "string" ? rawVariableName.trim() : ""
        const uniqueName = createUniqueJsIdentifier(previousName, usedVariableNames)
        nextNode.data = {
          ...nextNode.data,
          config: {
            ...nextNode.data.config,
            variableName: uniqueName,
          },
        }

        if (previousName && previousName !== uniqueName) {
          variableRenames.push({
            sourceNodeId: nextNode.id,
            oldName: previousName,
            newName: uniqueName,
          })
        }
      }

      nodeIdMap.set(nodeDto.id, nextNode.id)
      return nextNode
    })

    let nextNodesWithRefactors = nextNodes
    variableRenames.forEach((rename) => {
      nextNodesWithRefactors = refactorVariableReferencesInGraph(
        nextNodesWithRefactors,
        rename
      )
    })

    const nextNodeById = new Map(nextNodesWithRefactors.map((node) => [node.id, node]))
    let nextEdges = [...currentGraph.edges]
    parsed.value.connections.forEach((connection) => {
      const source = nodeIdMap.get(connection.sourceNodeId)
      const target = nodeIdMap.get(connection.targetNodeId)
      if (!source || !target) return
      const sourceNode = nextNodeById.get(source)
      const targetNode = nextNodeById.get(target)
      if (!sourceNode || !targetNode) return

      nextEdges = addEdge(
        {
          source,
          target,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
          data: {
            sourceKind: sourceNode.data.kind,
            targetKind: targetNode.data.kind,
          },
        },
        nextEdges
      ) as WorkflowEdge[]
    })

    commitGraphState(set, {
      ...currentGraph,
      nodes: [...currentGraph.nodes, ...nextNodesWithRefactors],
      edges: nextEdges,
    })
    set({
      selectedNodeIds: nextNodesWithRefactors.map((node) => node.id),
      lastError: null,
    })
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
    set({
      history: createHistoryState(importedGraph),
      selectedNodeIds: [],
      lastError: null,
    })
    return true
  },
  exportInternal: () => {
    return exportInternalJson(get().history.present)
  },
  exportDomain: () => {
    return exportDomainJson(get().history.present)
  },
})
