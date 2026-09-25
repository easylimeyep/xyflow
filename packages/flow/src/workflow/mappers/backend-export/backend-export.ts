import { allowsMultipleBranchTargets } from "../../node-registry/node-graph-rules"
import type { NodeRegistry } from "../../node-registry/registry"
import type {
  BackendEvaluatorWorkflowNodeDTO,
  BackendMultiTargetEvaluatorWorkflowNodeDTO,
  BackendRegularWorkflowNodeDTO,
  BackendSingleTargetEvaluatorWorkflowNodeDTO,
  BackendWorkflowDTO,
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
  NodeKind,
} from "../../types"
import {
  EVALUATOR_FALSE_HANDLE,
  EVALUATOR_TRUE_HANDLE,
  isBranchingKind,
} from "../../types/branching"

type IncomingByTarget = Map<string, DomainWorkflowConnectionDTO[]>
type OutgoingBySource = Map<string, DomainWorkflowConnectionDTO[]>

interface GraphIndexes {
  nodeById: Map<string, DomainWorkflowNodeDTO>
  incomingByTarget: IncomingByTarget
  outgoingBySource: OutgoingBySource
}

type AvailableNode = {
  id: string
  sourceHandle: string | null
}

function byNodePositionLabelAndId(
  nodeById: Map<string, DomainWorkflowNodeDTO>,
  leftId: string,
  rightId: string
): number {
  const left = nodeById.get(leftId)
  const right = nodeById.get(rightId)
  if (!left || !right) {
    return leftId.localeCompare(rightId)
  }

  return (
    left.position.x - right.position.x ||
    left.position.y - right.position.y ||
    left.label.localeCompare(right.label) ||
    left.id.localeCompare(right.id)
  )
}

function sourceHandlePriority(sourceHandle: string | null): number {
  switch (sourceHandle) {
    case EVALUATOR_TRUE_HANDLE:
      return 0
    case EVALUATOR_FALSE_HANDLE:
      return 1
    case null:
      return 2
    default:
      return 3
  }
}

function compareAvailableNodes(
  nodeById: Map<string, DomainWorkflowNodeDTO>,
  left: AvailableNode,
  right: AvailableNode
): number {
  return (
    sourceHandlePriority(left.sourceHandle) -
      sourceHandlePriority(right.sourceHandle) ||
    byNodePositionLabelAndId(nodeById, left.id, right.id)
  )
}

function buildGraphIndexes(dto: DomainWorkflowDTO): GraphIndexes {
  const nodeById = new Map(dto.nodes.map((node) => [node.id, node]))
  const incomingByTarget: IncomingByTarget = new Map()
  const outgoingBySource: OutgoingBySource = new Map()

  for (const connection of dto.connections) {
    const sourceNode = nodeById.get(connection.sourceNodeId)
    const targetNode = nodeById.get(connection.targetNodeId)
    if (!sourceNode || !targetNode) {
      throw new Error(
        `Cannot export backend workflow: connection "${connection.id}" references an unknown node.`
      )
    }

    const incoming = incomingByTarget.get(connection.targetNodeId) ?? []
    incoming.push(connection)
    incomingByTarget.set(connection.targetNodeId, incoming)

    const outgoing = outgoingBySource.get(connection.sourceNodeId) ?? []
    outgoing.push(connection)
    outgoingBySource.set(connection.sourceNodeId, outgoing)
  }

  return {
    nodeById,
    incomingByTarget,
    outgoingBySource,
  }
}

function isRootNode(node: DomainWorkflowNodeDTO): boolean {
  return node.kind === "inlineExpression" && node.config.isRoot === true
}

function validateRoots(
  roots: DomainWorkflowNodeDTO[],
  incomingByTarget: IncomingByTarget
) {
  if (roots.length === 0) {
    throw new Error(
      "Cannot export backend workflow: workflow must contain at least one root node."
    )
  }

  const rootWithIncoming = roots.find(
    (root) => (incomingByTarget.get(root.id)?.length ?? 0) > 0
  )
  if (rootWithIncoming) {
    throw new Error(
      `Cannot export backend workflow: root node "${rootWithIncoming.id}" cannot have incoming connections.`
    )
  }
}

function validateEvaluatorBranches(
  registry: NodeRegistry,
  nodeById: Map<string, DomainWorkflowNodeDTO>,
  outgoingBySource: OutgoingBySource
) {
  for (const node of nodeById.values()) {
    if (!isBranchingKind(node.kind)) {
      continue
    }

    const allowsMultiple = allowsMultipleBranchTargets(registry, node.kind)

    const outgoing = outgoingBySource.get(node.id) ?? []
    let trueBranches = 0
    let falseBranches = 0

    for (const connection of outgoing) {
      if (connection.sourceHandle === EVALUATOR_TRUE_HANDLE) {
        trueBranches += 1
      } else if (connection.sourceHandle === EVALUATOR_FALSE_HANDLE) {
        falseBranches += 1
      } else {
        throw new Error(
          `Cannot export backend workflow: ${node.kind} node "${node.id}" has unsupported branch handle.`
        )
      }
    }

    if (!allowsMultiple && (trueBranches > 1 || falseBranches > 1)) {
      throw new Error(
        `Cannot export backend workflow: ${node.kind} node "${node.id}" has duplicate branch connections.`
      )
    }
  }
}

function sortedOutgoingConnections(
  outgoing: DomainWorkflowConnectionDTO[],
  nodeById: Map<string, DomainWorkflowNodeDTO>
): DomainWorkflowConnectionDTO[] {
  return [...outgoing].sort((left, right) => {
    return (
      sourceHandlePriority(left.sourceHandle) -
        sourceHandlePriority(right.sourceHandle) ||
      byNodePositionLabelAndId(nodeById, left.targetNodeId, right.targetNodeId)
    )
  })
}

function sortedNodesByPositionLabelAndId(
  nodes: DomainWorkflowNodeDTO[],
  nodeById: Map<string, DomainWorkflowNodeDTO>
): DomainWorkflowNodeDTO[] {
  return [...nodes].sort((left, right) =>
    byNodePositionLabelAndId(nodeById, left.id, right.id)
  )
}

function resolveBackendOrder(
  registry: NodeRegistry,
  dto: DomainWorkflowDTO,
  indexes: GraphIndexes
): DomainWorkflowNodeDTO[] {
  const { nodeById, incomingByTarget, outgoingBySource } = indexes
  const roots = sortedNodesByPositionLabelAndId(
    dto.nodes.filter(isRootNode),
    nodeById
  )

  validateRoots(roots, incomingByTarget)
  validateEvaluatorBranches(registry, nodeById, outgoingBySource)

  const reachableIds = collectReachableIds(roots, outgoingBySource)
  const unreachable = dto.nodes.find((node) => !reachableIds.has(node.id))
  if (unreachable) {
    throw new Error(
      `Cannot export backend workflow: node "${unreachable.id}" is unreachable from root nodes.`
    )
  }

  const available: AvailableNode[] = roots.map((root) => ({
    id: root.id,
    sourceHandle: null,
  }))
  const ordered: DomainWorkflowNodeDTO[] = []
  const orderedIds = new Set<string>()
  const queuedIds = new Set(roots.map((root) => root.id))

  // Strict export now emits a deterministic serialization order for all
  // root-reachable nodes, including cyclic graphs (not a topological order).
  while (available.length > 0) {
    available.sort((left, right) =>
      compareAvailableNodes(nodeById, left, right)
    )
    const current = available.shift()
    if (!current) {
      continue
    }
    queuedIds.delete(current.id)
    if (orderedIds.has(current.id)) {
      continue
    }

    const currentNode = nodeById.get(current.id)
    if (!currentNode) {
      continue
    }

    ordered.push(currentNode)
    orderedIds.add(current.id)

    for (const connection of sortedOutgoingConnections(
      outgoingBySource.get(current.id) ?? [],
      nodeById
    )) {
      const targetId = connection.targetNodeId
      if (
        reachableIds.has(targetId) &&
        !orderedIds.has(targetId) &&
        !queuedIds.has(targetId)
      ) {
        queuedIds.add(targetId)
        available.push({
          id: targetId,
          sourceHandle: connection.sourceHandle,
        })
      }
    }
  }

  if (ordered.length !== reachableIds.size) {
    throw new Error(
      "Cannot export backend workflow: failed to establish a deterministic serialization order."
    )
  }

  return ordered
}

function resolveDraftBackendOrder(
  dto: DomainWorkflowDTO,
  indexes: GraphIndexes
): DomainWorkflowNodeDTO[] {
  const { nodeById, incomingByTarget, outgoingBySource } = indexes
  const remainingIncomingCount = new Map(
    dto.nodes.map((node) => [
      node.id,
      incomingByTarget.get(node.id)?.length ?? 0,
    ])
  )
  const ordered: DomainWorkflowNodeDTO[] = []
  const orderedIds = new Set<string>()
  const remainingIds = new Set(dto.nodes.map((node) => node.id))
  const queuedIds = new Set<string>()
  const available: AvailableNode[] = []

  function queueNode(id: string, sourceHandle: string | null) {
    if (!remainingIds.has(id) || queuedIds.has(id) || orderedIds.has(id)) {
      return
    }

    queuedIds.add(id)
    available.push({ id, sourceHandle })
  }

  const initialRoots = sortedNodesByPositionLabelAndId(
    dto.nodes.filter(isRootNode),
    nodeById
  )
  const initialAvailable =
    initialRoots.length > 0
      ? initialRoots
      : sortedNodesByPositionLabelAndId(
          dto.nodes.filter(
            (node) => (incomingByTarget.get(node.id)?.length ?? 0) === 0
          ),
          nodeById
        )

  for (const node of initialAvailable) {
    queueNode(node.id, null)
  }

  while (remainingIds.size > 0) {
    if (available.length === 0) {
      const remainingNodes = sortedNodesByPositionLabelAndId(
        dto.nodes.filter((node) => remainingIds.has(node.id)),
        nodeById
      )
      const readyNodes = remainingNodes.filter(
        (node) => (remainingIncomingCount.get(node.id) ?? 0) <= 0
      )
      const fallbackNodes =
        readyNodes.length > 0 ? readyNodes : remainingNodes.slice(0, 1)

      for (const node of fallbackNodes) {
        queueNode(node.id, null)
      }
    }

    available.sort((left, right) =>
      compareAvailableNodes(nodeById, left, right)
    )
    const current = available.shift()
    if (!current) {
      continue
    }
    queuedIds.delete(current.id)

    if (orderedIds.has(current.id) || !remainingIds.has(current.id)) {
      continue
    }

    const currentNode = nodeById.get(current.id)
    if (!currentNode) {
      continue
    }

    ordered.push(currentNode)
    orderedIds.add(current.id)
    remainingIds.delete(current.id)

    for (const connection of sortedOutgoingConnections(
      outgoingBySource.get(current.id) ?? [],
      nodeById
    )) {
      const targetId = connection.targetNodeId
      if (!remainingIds.has(targetId)) {
        continue
      }

      const nextIncomingCount = (remainingIncomingCount.get(targetId) ?? 0) - 1
      remainingIncomingCount.set(targetId, nextIncomingCount)
      if (nextIncomingCount <= 0) {
        queueNode(targetId, connection.sourceHandle)
      }
    }
  }

  return ordered
}

function collectReachableIds(
  roots: DomainWorkflowNodeDTO[],
  outgoingBySource: OutgoingBySource
): Set<string> {
  const reachable = new Set<string>()
  const queue = roots.map((root) => root.id)

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || reachable.has(current)) {
      continue
    }

    reachable.add(current)
    for (const connection of outgoingBySource.get(current) ?? []) {
      queue.push(connection.targetNodeId)
    }
  }

  return reachable
}

function buildBackendIdByDomainId(orderedNodes: DomainWorkflowNodeDTO[]) {
  return new Map(orderedNodes.map((node, index) => [node.id, index + 1]))
}

function getBackendId(
  backendIdByDomainId: Map<string, number>,
  domainNodeId: string
): number {
  const backendId = backendIdByDomainId.get(domainNodeId)
  if (!backendId) {
    throw new Error(
      `Cannot export backend workflow: node "${domainNodeId}" was not assigned a backend id.`
    )
  }

  return backendId
}

function mapRegularNode(
  node: DomainWorkflowNodeDTO,
  outgoing: DomainWorkflowConnectionDTO[],
  backendIdByDomainId: Map<string, number>
): BackendRegularWorkflowNodeDTO {
  return {
    id: getBackendId(backendIdByDomainId, node.id),
    kind: node.kind as Exclude<NodeKind, "evaluator" | "jsonEvaluator">,
    position: { ...node.position },
    label: node.label,
    config: { ...node.config },
    next: outgoing.map((connection) =>
      getBackendId(backendIdByDomainId, connection.targetNodeId)
    ),
  }
}

function branchTargetIds(
  outgoing: DomainWorkflowConnectionDTO[],
  sourceHandle: string,
  backendIdByDomainId: Map<string, number>
): number[] {
  return outgoing
    .filter((connection) => connection.sourceHandle === sourceHandle)
    .map((connection) =>
      getBackendId(backendIdByDomainId, connection.targetNodeId)
    )
}

function mapEvaluatorNodeBase(
  node: DomainWorkflowNodeDTO,
  backendIdByDomainId: Map<string, number>
) {
  return {
    id: getBackendId(backendIdByDomainId, node.id),
    kind: node.kind as BackendEvaluatorWorkflowNodeDTO["kind"],
    position: { ...node.position },
    label: node.label,
    config: { ...node.config },
  }
}

function mapMultiTargetEvaluatorNode(
  node: DomainWorkflowNodeDTO,
  outgoing: DomainWorkflowConnectionDTO[],
  backendIdByDomainId: Map<string, number>
): BackendMultiTargetEvaluatorWorkflowNodeDTO {
  return {
    ...mapEvaluatorNodeBase(node, backendIdByDomainId),
    next_true: branchTargetIds(
      outgoing,
      EVALUATOR_TRUE_HANDLE,
      backendIdByDomainId
    ),
    next_false: branchTargetIds(
      outgoing,
      EVALUATOR_FALSE_HANDLE,
      backendIdByDomainId
    ),
  }
}

function mapSingleTargetEvaluatorNode(
  node: DomainWorkflowNodeDTO,
  outgoing: DomainWorkflowConnectionDTO[],
  backendIdByDomainId: Map<string, number>
): BackendSingleTargetEvaluatorWorkflowNodeDTO {
  // Draft export skips branch validation, so a duplicated branch can reach
  // here; the last target wins, as it always has.
  const nextTrue = branchTargetIds(
    outgoing,
    EVALUATOR_TRUE_HANDLE,
    backendIdByDomainId
  ).at(-1)
  const nextFalse = branchTargetIds(
    outgoing,
    EVALUATOR_FALSE_HANDLE,
    backendIdByDomainId
  ).at(-1)

  return {
    ...mapEvaluatorNodeBase(node, backendIdByDomainId),
    next_true: nextTrue ?? null,
    next_false: nextFalse ?? null,
  }
}

function mapDomainWorkflowToBackend(
  registry: NodeRegistry,
  dto: DomainWorkflowDTO,
  orderedNodes: DomainWorkflowNodeDTO[],
  indexes: GraphIndexes
): BackendWorkflowDTO {
  const backendIdByDomainId = buildBackendIdByDomainId(orderedNodes)

  return {
    id: dto.id,
    name: dto.name,
    version: dto.version,
    metadata: { ...dto.metadata },
    nodes: orderedNodes.map((node) => {
      const outgoing = sortedOutgoingConnections(
        indexes.outgoingBySource.get(node.id) ?? [],
        indexes.nodeById
      )

      if (!isBranchingKind(node.kind)) {
        return mapRegularNode(node, outgoing, backendIdByDomainId)
      }

      return allowsMultipleBranchTargets(registry, node.kind)
        ? mapMultiTargetEvaluatorNode(node, outgoing, backendIdByDomainId)
        : mapSingleTargetEvaluatorNode(node, outgoing, backendIdByDomainId)
    }),
  }
}

/**
 * Serialize a domain workflow into the backend's numbered-node shape.
 *
 * The registry is the editor's vocabulary: it decides, per kind, whether a
 * branch serializes to one target (`next_true: number | null`) or to a list
 * (`next_true: number[]`). A host reads it with `useNodeRegistry()` or builds
 * it with `createNodeRegistry(definitions)`.
 */
export function exportDomainWorkflowForBackend(
  registry: NodeRegistry,
  dto: DomainWorkflowDTO
): BackendWorkflowDTO {
  const indexes = buildGraphIndexes(dto)
  const orderedNodes = resolveBackendOrder(registry, dto, indexes)

  return mapDomainWorkflowToBackend(registry, dto, orderedNodes, indexes)
}

export function exportDraftDomainWorkflowForBackend(
  registry: NodeRegistry,
  dto: DomainWorkflowDTO
): BackendWorkflowDTO {
  const indexes = buildGraphIndexes(dto)
  const orderedNodes = resolveDraftBackendOrder(dto, indexes)

  return mapDomainWorkflowToBackend(registry, dto, orderedNodes, indexes)
}
