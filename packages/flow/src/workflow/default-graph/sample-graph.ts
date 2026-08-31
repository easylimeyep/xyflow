import type { NodeDefinition } from "../node-registry/define-node"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowGraphState } from "../types/types"
import { DEFAULT_VIEWPORT, initialWorkflowGraph } from "./default-graph"

/**
 * A one-node document over the package's own vocabulary.
 *
 * The demo app and the package's suites need a graph that actually contains
 * something; products bring their own. It takes the vocabulary to build over,
 * the same way every other node-building entry point does.
 *
 * Throws when `inlineExpression` is absent from `definitions`. That is the
 * intended failure: it names the missing kind instead of rendering an editor
 * that silently drops the node.
 */
export function createKeywordSampleGraph(
  definitions: readonly NodeDefinition[]
): WorkflowGraphState {
  const keywordNode = createWorkflowNode(
    createNodeRegistry(definitions),
    "inlineExpression",
    { x: 0, y: 80 },
    "Keyword"
  )
  keywordNode.data.config.isRoot = true

  return {
    ...initialWorkflowGraph,
    nodes: [keywordNode],
    edges: [],
    viewport: DEFAULT_VIEWPORT,
  }
}
