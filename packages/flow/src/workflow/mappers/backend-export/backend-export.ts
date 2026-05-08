import type {
  BackendEvaluatorWorkflowNodeDTO,
  BackendRegularWorkflowNodeDTO,
  BackendWorkflowDTO,
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
  NodeKind,
} from "../../types"

const EVALUATOR_TRUE_HANDLE = "evaluator-true"
const EVALUATOR_FALSE_HANDLE = "evaluator-false"

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
    throw new Error("Cannot export backend workflow: workflow must contain at least one root node.")
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
  nodeById: Map<string, DomainWorkflowNodeDTO>,
  outgoingBySource: OutgoingBySource
) {
  for (const node of nodeById.values()) {
    if (node.kind !== "evaluator") {
      continue
    }

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
          `Cannot export backend workflow: evaluator node "${node.id}" has unsupported branch handle.`
        )
      }
    }

    if (trueBranches > 1 || falseBranches > 1) {
      throw new Error(
        `Cannot export backend workflow: evaluator node "${node.id}" has duplicate branch connections.`
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

function resolveBackendOrder(
  dto: DomainWorkflowDTO,
  indexes: GraphIndexes
): DomainWorkflowNodeDTO[] {
  const { nodeById, incomingByTarget, outgoingBySource } = indexes
  const roots = dto.nodes
    .filter(isRootNode)
    .sort((left, right) => byNodePositionLabelAndId(nodeById, left.id, right.id))

  validateRoots(roots, incomingByTarget)
  validateEvaluatorBranches(nodeById, outgoingBySource)

  const remainingIncomingCount = new Map(
    dto.nodes.map((node) => [node.id, incomingByTarget.get(node.id)?.length ?? 0])
  )
  const available: AvailableNode[] = roots.map((root) => ({
    id: root.id,
    sourceHandle: null,
  }))
  const ordered: DomainWorkflowNodeDTO[] = []
  const orderedIds = new Set<string>()

  while (available.length > 0) {
    available.sort((left, right) => compareAvailableNodes(nodeById, left, right))
    const current = available.shift()
    if (!current || orderedIds.has(current.id)) {
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
      const nextIncomingCount = (remainingIncomingCount.get(targetId) ?? 0) - 1
      remainingIncomingCount.set(targetId, nextIncomingCount)
      if (nextIncomingCount === 0) {
        available.push({
          id: targetId,
          sourceHandle: connection.sourceHandle,
        })
      }
    }
  }

  if (ordered.length !== dto.nodes.length) {
    const reachableIds = collectReachableIds(roots, outgoingBySource)
    const unreachable = dto.nodes.find((node) => !reachableIds.has(node.id))
    if (unreachable) {
      throw new Error(
        `Cannot export backend workflow: node "${unreachable.id}" is unreachable from root nodes.`
      )
    }

    throw new Error("Cannot export backend workflow: graph contains a cycle.")
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
    kind: node.kind as Exclude<NodeKind, "evaluator">,
    position: { ...node.position },
    label: node.label,
    config: { ...node.config },
    next: outgoing.map((connection) =>
      getBackendId(backendIdByDomainId, connection.targetNodeId)
    ),
  }
}

function mapEvaluatorNode(
  node: DomainWorkflowNodeDTO,
  outgoing: DomainWorkflowConnectionDTO[],
  backendIdByDomainId: Map<string, number>
): BackendEvaluatorWorkflowNodeDTO {
  let nextTrue: number | null = null
  let nextFalse: number | null = null

  for (const connection of outgoing) {
    if (connection.sourceHandle === EVALUATOR_TRUE_HANDLE) {
      nextTrue = getBackendId(backendIdByDomainId, connection.targetNodeId)
    }
    if (connection.sourceHandle === EVALUATOR_FALSE_HANDLE) {
      nextFalse = getBackendId(backendIdByDomainId, connection.targetNodeId)
    }
  }

  return {
    id: getBackendId(backendIdByDomainId, node.id),
    kind: "evaluator",
    position: { ...node.position },
    label: node.label,
    config: { ...node.config },
    next_true: nextTrue,
    next_false: nextFalse,
  }
}

export function exportDomainWorkflowForBackend(
  dto: DomainWorkflowDTO
): BackendWorkflowDTO {
  const indexes = buildGraphIndexes(dto)
  const orderedNodes = resolveBackendOrder(dto, indexes)
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

      if (node.kind === "evaluator") {
        return mapEvaluatorNode(node, outgoing, backendIdByDomainId)
      }

      return mapRegularNode(node, outgoing, backendIdByDomainId)
    }),
  }
}
