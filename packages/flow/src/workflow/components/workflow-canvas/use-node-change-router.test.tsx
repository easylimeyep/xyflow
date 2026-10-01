// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { useEffect, type ReactElement } from "react"
import type { NodeChange } from "@xyflow/react"
import { describe, expect, it, vi } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import type { WorkflowNode } from "../../types"
import { useNodeChangeRouter } from "./use-node-change-router"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../../node-registry/registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

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

    const rootKeywordNode = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
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

    const nodeA = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    nodeA.data.config.isRoot = true
    const nodeB = createWorkflowNode(registry, "inlineExpression", {
      x: 200,
      y: 0,
    })

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

  it("routes selection-only changes without emitting structural changes", () => {
    const onStructuralChanges = vi.fn()
    const onSelectionChange = vi.fn()
    const onRouter = vi.fn()

    const nodeA = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    nodeA.data.config.isRoot = true
    const nodeB = createWorkflowNode(registry, "extractor", { x: 200, y: 0 })

    render(
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

    routeChanges?.([{ id: nodeB.id, type: "select", selected: true }])

    expect(onSelectionChange).toHaveBeenCalledWith([nodeB.id])
    expect(onStructuralChanges).not.toHaveBeenCalled()
  })
  it("selects a node again after the selection was cleared outside the router", () => {
    // Click A, then Delete (store clears the selection), then undo brings A
    // back unselected: clicking A must select it again.
    const onSelectionChange = vi.fn()
    let route: ((changes: NodeChange<WorkflowNode>[]) => void) | null = null
    const nodeA = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    const harness = (nodes: WorkflowNode[]) => (
      <Harness
        nodes={nodes}
        onStructuralChanges={vi.fn()}
        onSelectionChange={onSelectionChange}
        onRouter={(router) => {
          route = router
        }}
      />
    )
    const { rerender } = render(harness([{ ...nodeA, selected: false }]))

    route!([{ id: nodeA.id, type: "select", selected: true }])
    rerender(harness([{ ...nodeA, selected: true }]))
    rerender(harness([{ ...nodeA, selected: false }]))
    route!([{ id: nodeA.id, type: "select", selected: true }])

    expect(onSelectionChange).toHaveBeenNthCalledWith(1, [nodeA.id])
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, [nodeA.id])
  })

  it("does not re-emit a selection the nodes already have", () => {
    const onSelectionChange = vi.fn()
    let route: ((changes: NodeChange<WorkflowNode>[]) => void) | null = null
    const nodeA = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    render(
      <Harness
        nodes={[{ ...nodeA, selected: true }]}
        onStructuralChanges={vi.fn()}
        onSelectionChange={onSelectionChange}
        onRouter={(router) => {
          route = router
        }}
      />
    )

    route!([{ id: nodeA.id, type: "select", selected: true }])

    expect(onSelectionChange).not.toHaveBeenCalled()
  })
})
