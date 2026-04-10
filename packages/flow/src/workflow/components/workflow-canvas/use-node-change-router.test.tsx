// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { useEffect, type ReactElement } from "react"
import type { NodeChange } from "@xyflow/react"
import { describe, expect, it, vi } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import type { WorkflowNode } from "../../types"
import { useNodeChangeRouter } from "./use-node-change-router"

function Harness({
  nodes,
  onStructuralChanges,
  onSelectionChange,
  onRouter,
}: {
  nodes: WorkflowNode[]
  onStructuralChanges: (changes: NodeChange<WorkflowNode>[]) => void
  onSelectionChange: (nodeIds: string[]) => void
  onRouter: (router: (changes: NodeChange<WorkflowNode>[]) => void) => void
}): ReactElement {
  const router = useNodeChangeRouter({
    nodes,
    onStructuralChanges,
    onSelectionChange,
  })

  useEffect(() => {
    onRouter(router)
  }, [onRouter, router])

  return <div />
}

describe("useNodeChangeRouter", () => {
  it("keeps callback identity stable when only nodes array identity changes", () => {
    const onStructuralChanges = vi.fn()
    const onSelectionChange = vi.fn()
    const onRouter = vi.fn()

    const rootKeywordNode = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    rootKeywordNode.data.config.isRoot = true
    const initialNodes = [{ ...rootKeywordNode, selected: false }]

    const { rerender } = render(
      <Harness
        nodes={initialNodes}
        onStructuralChanges={onStructuralChanges}
        onSelectionChange={onSelectionChange}
        onRouter={onRouter}
      />
    )

    const nextNodes = initialNodes.map((node) => ({ ...node }))
    rerender(
      <Harness
        nodes={nextNodes}
        onStructuralChanges={onStructuralChanges}
        onSelectionChange={onSelectionChange}
        onRouter={onRouter}
      />
    )

    expect(onRouter).toHaveBeenCalledTimes(1)
  })

  it("uses latest node selection snapshot after rerender", () => {
    const onStructuralChanges = vi.fn()
    const onSelectionChange = vi.fn()
    const onRouter = vi.fn()

    const nodeA = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    nodeA.data.config.isRoot = true
    const nodeB = createWorkflowNode("inlineExpression", { x: 200, y: 0 })

    const { rerender } = render(
      <Harness
        nodes={[
          { ...nodeA, selected: false },
          { ...nodeB, selected: false },
        ]}
        onStructuralChanges={onStructuralChanges}
        onSelectionChange={onSelectionChange}
        onRouter={onRouter}
      />
    )

    const routeChanges = onRouter.mock.calls[0]?.[0] as
      | ((changes: NodeChange<WorkflowNode>[]) => void)
      | undefined
    expect(routeChanges).toBeTypeOf("function")

    rerender(
      <Harness
        nodes={[
          { ...nodeA, selected: true },
          { ...nodeB, selected: false },
        ]}
        onStructuralChanges={onStructuralChanges}
        onSelectionChange={onSelectionChange}
        onRouter={onRouter}
      />
    )

    routeChanges?.([
      {
        id: nodeB.id,
        type: "select",
        selected: true,
      },
    ])

    expect(onSelectionChange).toHaveBeenCalledWith([nodeA.id, nodeB.id])
  })
})
