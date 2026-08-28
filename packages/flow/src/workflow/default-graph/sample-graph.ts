import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import { DEFAULT_VIEWPORT, initialWorkflowGraph } from "./default-graph"

/**
 * A one-node document over the package's own vocabulary.
 *
 * The demo app and the package's suites need a graph that actually contains
 * something; products bring their own. It is a function rather than a constant
 * because building a node reads the registry, and the registry is empty until
 * someone registers `builtinDefinitions` — so the read has to happen at call
 * time, not at import time.
 *
 * Throws when `inlineExpression` is not registered. That is the intended
 * failure: it names the missing registration instead of rendering an editor
 * that silently drops the node.
 */
export function createKeywordSampleGraph(): WorkflowGraphState {
  const keywordNode = createWorkflowNode(
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
