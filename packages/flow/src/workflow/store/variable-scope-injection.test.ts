import { describe, expect, it } from "vitest"

import { graphScope } from "../expression/variables/variable-scope"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../node-registry/registry"
import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import {
  selectExpressionVariableTypesForNode,
  selectExpressionVariablesForNode,
} from "./selectors"
import { createWorkflowStore } from "./store"

const registry = createNodeRegistry(builtinBaseDefinitions)

/** A producer and a consumer with no edge between them. */
function createDisconnectedGraph(): {
  graph: WorkflowGraphState
  producerId: string
  consumerId: string
} {
  const producer = createWorkflowNode(
    registry,
    "setVariable",
    { x: 0, y: 0 },
    "Setter"
  )
  producer.data.config.variableName = "userId"
  producer.data.config.variableType = "array"

  const consumer = createWorkflowNode(
    registry,
    "inlineExpression",
    { x: 240, y: 0 },
    "Inline"
  )

  return {
    graph: {
      nodes: [producer, consumer],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      document: {
        id: "workflow-test",
        name: "Scope Injection",
        version: 1,
        metadata: {},
      },
    },
    producerId: producer.id,
    consumerId: consumer.id,
  }
}

describe("variable scope injection through the store", () => {
  it("offers a disconnected producer when the host passes graphScope", () => {
    const { graph, consumerId } = createDisconnectedGraph()
    const store = createWorkflowStore({
      initialGraph: graph,
      definitions: builtinBaseDefinitions,
      runtime: { variables: { scope: graphScope } },
    })

    const options = selectExpressionVariablesForNode(
      store.getState(),
      consumerId
    )

    expect(options.map((option) => option.value)).toEqual(["userId"])
  })

  it("hides that producer when the host passes no scope at all", () => {
    const { graph, consumerId } = createDisconnectedGraph()
    const store = createWorkflowStore({
      initialGraph: graph,
      definitions: builtinBaseDefinitions,
    })

    expect(
      selectExpressionVariablesForNode(store.getState(), consumerId)
    ).toHaveLength(0)
  })

  it("caches variable types alongside the options", () => {
    const { graph, consumerId } = createDisconnectedGraph()
    const store = createWorkflowStore({
      initialGraph: graph,
      definitions: builtinBaseDefinitions,
      runtime: { variables: { scope: graphScope } },
    })

    expect(
      selectExpressionVariableTypesForNode(store.getState(), consumerId)
    ).toEqual({ userId: "array" })
  })

  it("rebuilds both caches together when a producer is renamed", () => {
    const { graph, producerId, consumerId } = createDisconnectedGraph()
    const store = createWorkflowStore({
      initialGraph: graph,
      definitions: builtinBaseDefinitions,
      runtime: { variables: { scope: graphScope } },
    })

    store.getState().updateNodeConfig(producerId, {
      kind: "setVariable",
      key: "variableName",
      value: "accountId",
    })

    const state = store.getState()
    const options = selectExpressionVariablesForNode(state, consumerId)
    const types = selectExpressionVariableTypesForNode(state, consumerId)

    expect(options.map((option) => option.value)).toEqual(["accountId"])
    expect(types).toEqual({ accountId: "array" })
  })

  it("falls back to the default scope when the host passes a non-function", () => {
    const { graph, consumerId } = createDisconnectedGraph()
    const store = createWorkflowStore({
      initialGraph: graph,
      definitions: builtinBaseDefinitions,
      // A runtime config arriving from a server can carry anything.
      runtime: {
        variables: { scope: "graph" as unknown as typeof graphScope },
      },
    })

    expect(
      selectExpressionVariablesForNode(store.getState(), consumerId)
    ).toHaveLength(0)
  })
})
