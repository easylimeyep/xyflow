import { createHistoryState } from "@workspace/store"
import { addEdge, type XYPosition } from "@xyflow/react"

import { refactorPlainVariableReferencesInGraph } from "../graph-refactors"
import {
  domainToInternal,
  exportDomainDto,
  exportSelectionClipboardJson,
  isValidDomainDto,
  parseDomainGraphJson,
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
  deduplicateNodeLabels,
  getFallbackPasteAnchor,
  readTextFromClipboard,
  writeTextToClipboard,
} from "../helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"

const VARIABLE_LABEL_KINDS = new Set(["extractor", "setVariable"])

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

    const { nodes: nextNodesWithRefactors, nodeIdMap } = buildPastedNodes(
      parsed.value.nodes,
      anchor,
      usedLabels
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
    const state = get()
    const parsed = parseDomainGraphJson(rawJson)
    if (!parsed.success || !parsed.value) {
      set({
        lastError: createWorkflowError("IMPORT_INVALID_SCHEMA", parsed.error ?? "Import failed due to invalid schema."),
      })
      return false
    }

    const mappedPayload =
      state.runtime.importDomain?.mapper?.(parsed.value) ?? parsed.value
    if (!isValidDomainDto(mappedPayload)) {
      set({
        lastError: createWorkflowError(
          "IMPORT_INVALID_SCHEMA",
          "Import failed due to invalid schema."
        ),
      })
      return false
    }

    const importedGraph = cloneGraphState(domainToInternal(mappedPayload))
    const { nodes: nodesWithUniqueLabels, renames: labelRenames } =
      deduplicateNodeLabels(importedGraph.nodes, new Set<string>())

    const kindByOldLabel = new Map(importedGraph.nodes.map((n) => [n.data.label, n.data.kind]))
    let normalizedNodes = nodesWithUniqueLabels
    labelRenames.forEach((rename) => {
      const kind = kindByOldLabel.get(rename.oldLabel) ?? ""
      if (VARIABLE_LABEL_KINDS.has(kind)) {
        normalizedNodes = refactorPlainVariableReferencesInGraph(
          normalizedNodes,
          rename.oldLabel,
          rename.newLabel
        )
      }
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
  exportDomain: () => {
    const state = get()
    const payload = exportDomainDto(state.history.present)
    const nextPayload = state.runtime.exportDomain?.mapper?.(payload) ?? payload

    return nextPayload
  },
})

function buildPastedNodes(
  parsedNodes: DomainWorkflowNodeDTO[],
  anchor: XYPosition,
  existingLabels: Set<string>
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

  const kindByOldLabel = new Map(createdNodes.map((n) => [n.data.label, n.data.kind]))
  const { nodes: nodesWithUniqueLabels, renames: labelRenames } =
    deduplicateNodeLabels(createdNodes, existingLabels)

  let nodes = nodesWithUniqueLabels
  labelRenames.forEach((rename) => {
    const kind = kindByOldLabel.get(rename.oldLabel) ?? ""
    if (VARIABLE_LABEL_KINDS.has(kind)) {
      nodes = refactorPlainVariableReferencesInGraph(nodes, rename.oldLabel, rename.newLabel)
    }
  })

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
