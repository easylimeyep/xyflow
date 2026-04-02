import { createHistoryState } from "@workspace/store"
import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import {
  shouldCommitEdgeHistory,
  shouldCommitNodeHistory,
  shouldSquashPreviousEdgeRemovalWithNodeRemoval,
} from "./collection-diff"

function createGraphState(): WorkflowGraphState {
  const source = createWorkflowNode("trigger", { x: 0, y: 0 })
  const target = createWorkflowNode("inlineExpression", { x: 300, y: 0 })
  return {
    nodes: [source, target],
    edges: [
      {
        id: "edge-1",
        source: source.id,
        target: target.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: source.data.kind,
          targetKind: target.data.kind,
        },
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: {
      id: "doc-1",
      name: "Flow",
      version: 1,
      metadata: {},
    },
  }
}

describe("collection-diff", () => {
  it("commits node history only at drag end for position changes", () => {
    expect(
      shouldCommitNodeHistory([
        {
          id: "node-1",
          type: "position",
          position: { x: 40, y: 0 },
          dragging: true,
        },
      ])
    ).toBe(false)

    expect(
      shouldCommitNodeHistory([
        {
          id: "node-1",
          type: "position",
          position: { x: 40, y: 0 },
          dragging: false,
        },
      ])
    ).toBe(true)
  })

  it("commits edge history on add and remove changes", () => {
    expect(shouldCommitEdgeHistory([{ id: "edge-1", type: "select", selected: true }])).toBe(
      false
    )
    expect(shouldCommitEdgeHistory([{ type: "add", item: {} as never }])).toBe(
      true
    )
    expect(shouldCommitEdgeHistory([{ id: "edge-1", type: "remove" }])).toBe(true)
  })

  it("squashes previous edge-removal commit when node deletion follows", () => {
    const previous = createGraphState()
    const present: WorkflowGraphState = {
      ...previous,
      edges: [],
    }
    const history = {
      ...createHistoryState(previous),
      past: [previous],
      present,
      future: [],
    }
    const removedNodeIds = new Set([previous.nodes[0]!.id])

    expect(shouldSquashPreviousEdgeRemovalWithNodeRemoval(history, removedNodeIds)).toBe(true)
  })
})
