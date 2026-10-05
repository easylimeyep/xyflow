import { addEdge, type XYPosition } from "@xyflow/react"

import {
  assignCopiedGroupIds,
  collectCopiedSelection,
  instantiateCopiedGroups,
} from "../../groups/group-copy"
import { clearDanglingGroupIds } from "../../groups/group-geometry"
import { refactorPlainVariableReferencesInGraph } from "../graph-refactors"
import {
  domainToInternal,
  exportDomainDto,
  exportSelectionClipboardJson,
  isValidDomainDto,
  parseDomainGraphJson,
  parseSelectionClipboardJson,
} from "../../mappers"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { normalizeNodeConfig } from "../../node-registry/node-config-normalization"
import type { NodeKind, NodeRegistry } from "../../node-registry/registry"
import { createWorkflowError } from "../../types/errors"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowNodeDTO,
  WorkflowEdge,
  WorkflowNode,
} from "../../types/types"
import {
  asDomainConnectionDTO,
  asDomainNodeDTO,
  buildExpressionSlicePatch,
  cloneGraphState,
  commitGraphState,
  projectSelectionWithoutHistory,
  deduplicateNodeLabels,
  getFallbackPasteAnchor,
  readTextFromClipboard,
  writeTextToClipboard,
} from "../helpers"
import type { WorkflowSliceCreator } from "../types"

const VARIABLE_LABEL_KINDS = new Set(["extractor", "setVariable"])

export const createIoSlice: WorkflowSliceCreator = (set, get, api) => ({
  copySelectionToClipboard: () =>
    copyNodesToClipboard(
      get,
      set,
      get().selectedNodeIds,
      get().selectedGroupIds,
      "Failed to copy selected nodes."
    ),
  copyAllToClipboard: () =>
    copyNodesToClipboard(
      get,
      set,
      get().graph.nodes.map((node) => node.id),
      get().graph.groups.map((group) => group.id),
      "Failed to copy workflow."
    ),
  pasteFromClipboard: async (pasteAnchor = null) => {
    const clipboardText = await readTextFromClipboard()
    if (!clipboardText) {
      set({
        lastError: createWorkflowError(
          "CLIPBOARD_EMPTY",
          "Clipboard is empty or unavailable."
        ),
      })
      return false
    }
    const parsed = parseSelectionClipboardJson(get().registry, clipboardText)
    if (!parsed.success || !parsed.value) {
      set({
        lastError: createWorkflowError(
          "IMPORT_INVALID_SCHEMA",
          parsed.error ?? "Clipboard JSON is not a workflow selection payload."
        ),
      })
      return false
    }

    const currentGraph = get().graph
    const anchor = pasteAnchor ?? getFallbackPasteAnchor(currentGraph.viewport)
    const usedLabels = new Set(
      currentGraph.nodes.map((n) => n.data.label.trim()).filter(Boolean)
    )

    const { nodes: nextNodesWithRefactors, nodeIdMap } = buildPastedNodes(
      get().registry,
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

    const { groups: pastedGroups, groupIdByNodeId } = instantiateCopiedGroups(
      parsed.value.groups ?? [],
      nodeIdMap,
      anchor
    )
    const pastedNodes = assignCopiedGroupIds(
      nextNodesWithRefactors,
      groupIdByNodeId
    )

    commitGraphState(set, {
      ...currentGraph,
      nodes: [...currentGraph.nodes, ...pastedNodes],
      edges: nextEdges,
      groups: [...currentGraph.groups, ...pastedGroups],
    })
    // Pasted whole groups are selected as groups, the rest as nodes.
    const pastedNodeIds = pastedNodes
      .filter((node) => !groupIdByNodeId.has(node.id))
      .map((node) => node.id)
    projectSelectionWithoutHistory(api, set, pastedNodeIds)
    set({
      selectedNodeIds: pastedNodeIds,
      selectedGroupIds: pastedGroups.map((group) => group.id),
      lastError: null,
    })
    get().hideGlobalValidation()
    return true
  },
  importFromJson: (rawJson) => {
    const state = get()
    const parsed = parseDomainGraphJson(state.registry, rawJson)
    if (!parsed.success || !parsed.value) {
      set({
        lastError: createWorkflowError(
          "IMPORT_INVALID_SCHEMA",
          parsed.error ?? "Import failed due to invalid schema."
        ),
      })
      return false
    }

    const mappedPayload =
      state.runtime.importDomain?.mapper?.(parsed.value) ?? parsed.value
    if (!isValidDomainDto(state.registry, mappedPayload)) {
      set({
        lastError: createWorkflowError(
          "IMPORT_INVALID_SCHEMA",
          "Import failed due to invalid schema."
        ),
      })
      return false
    }

    const importedGraph = clearDanglingGroupIds(
      cloneGraphState(domainToInternal(state.registry, mappedPayload))
    )
    const { nodes: nodesWithUniqueLabels, renames: labelRenames } =
      deduplicateNodeLabels(importedGraph.nodes, new Set<string>())

    const kindByOldLabel = new Map(
      importedGraph.nodes.map((n) => [n.data.label, n.data.kind])
    )
    let normalizedNodes = nodesWithUniqueLabels
    labelRenames.forEach((rename) => {
      const kind = kindByOldLabel.get(rename.oldLabel) ?? ""
      if (VARIABLE_LABEL_KINDS.has(kind)) {
        normalizedNodes = refactorPlainVariableReferencesInGraph(
          state.registry,
          normalizedNodes,
          rename.oldLabel,
          rename.newLabel
        )
      }
    })

    // An import replaces the document, so the undo stack that belonged to the
    // previous one goes with it rather than letting undo cross the boundary.
    api.history.getState().clear()
    api.history.getState().skip(() => {
      set((state) => ({
        graph: {
          ...importedGraph,
          nodes: normalizedNodes,
        },
        selectedNodeIds: [],
        selectedGroupIds: [],
        nodeDragOriginGraph: null,
        lastError: null,
        validation: {
          server: null,
          locallyHiddenKeys: new Set<string>(),
        },
        ...buildExpressionSlicePatch(state, {
          ...importedGraph,
          nodes: normalizedNodes,
        }),
      }))
    })
    return true
  },
  exportDomain: () => {
    const state = get()
    const payload = exportDomainDto(state.registry, state.graph)
    const nextPayload = state.runtime.exportDomain?.mapper?.(payload) ?? payload

    return nextPayload
  },
})

/**
 * Writes the given nodes and groups (a group brings all of its members), the
 * connections between the copied nodes, and every group copied whole, to the
 * clipboard in the selection format `pasteFromClipboard` reads back. Returns
 * `false` without touching the clipboard when there is nothing to copy.
 */
async function copyNodesToClipboard(
  get: Parameters<WorkflowSliceCreator>[1],
  set: Parameters<WorkflowSliceCreator>[0],
  selectedNodeIds: Iterable<string>,
  selectedGroupIds: Iterable<string>,
  failureMessage: string
): Promise<boolean> {
  const state = get()
  const copied = collectCopiedSelection(
    state.graph,
    selectedNodeIds,
    selectedGroupIds
  )
  const nodes = state.graph.nodes.filter((node) => copied.nodeIds.has(node.id))
  if (nodes.length === 0 && copied.groups.length === 0) {
    return false
  }

  const connections = state.graph.edges
    .filter(
      (edge) =>
        copied.nodeIds.has(edge.source) && copied.nodeIds.has(edge.target)
    )
    .map(asDomainConnectionDTO)
  const payload = exportSelectionClipboardJson(
    nodes.map((node) => asDomainNodeDTO(state.registry, node)),
    connections,
    copied.groups
  )
  const copiedToClipboard = await writeTextToClipboard(payload)
  if (!copiedToClipboard) {
    set({
      lastError: createWorkflowError("CLIPBOARD_WRITE_FAILED", failureMessage),
    })
    return false
  }

  set({ lastError: null })
  return true
}

function buildPastedNodes(
  registry: NodeRegistry,
  parsedNodes: DomainWorkflowNodeDTO[],
  anchor: XYPosition,
  existingLabels: Set<string>
): { nodes: WorkflowNode[]; nodeIdMap: Map<string, string> } {
  const nodeIdMap = new Map<string, string>()
  const createdNodes: WorkflowNode[] = parsedNodes.map((nodeDto) => {
    const nextNode = createWorkflowNode(
      registry,
      nodeDto.kind as NodeKind,
      { x: anchor.x + nodeDto.position.x, y: anchor.y + nodeDto.position.y },
      nodeDto.label
    )
    nextNode.data = {
      kind: nodeDto.kind,
      label: nodeDto.label,
      config: normalizeNodeConfig(
        registry,
        nodeDto.kind as NodeKind,
        nodeDto.config
      ),
    }
    nodeIdMap.set(nodeDto.id, nextNode.id)
    return nextNode
  })

  const kindByOldLabel = new Map(
    createdNodes.map((n) => [n.data.label, n.data.kind])
  )
  const { nodes: nodesWithUniqueLabels, renames: labelRenames } =
    deduplicateNodeLabels(createdNodes, existingLabels)

  let nodes = nodesWithUniqueLabels
  labelRenames.forEach((rename) => {
    const kind = kindByOldLabel.get(rename.oldLabel) ?? ""
    if (VARIABLE_LABEL_KINDS.has(kind)) {
      nodes = refactorPlainVariableReferencesInGraph(
        registry,
        nodes,
        rename.oldLabel,
        rename.newLabel
      )
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
        data: {
          sourceKind: sourceNode.data.kind,
          targetKind: targetNode.data.kind,
        },
      },
      nextEdges
    ) as WorkflowEdge[]
  })
  return nextEdges
}
