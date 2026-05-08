// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createWorkflowNode } from "../../node-registry"
import { WorkflowStoreProvider } from "../../store"
import type { WorkflowGraphState } from "../../types"
import { OutputQuickAddAffordance } from "./output-quick-add-affordance"

vi.mock("@xyflow/react", () => {
  return {
    Position: {
      Right: "right",
    },
    Handle: ({
      id,
      type,
    }: {
      id?: string
      type: string
      position: string
      className?: string
    }) => <div data-testid={`mock-handle-${type}-${id ?? "default"}`} />,
  }
})

function createEvaluatorGraph(): {
  graph: WorkflowGraphState
  evaluatorId: string
} {
  const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 })
  const result = createWorkflowNode("result", { x: 320, y: 0 })

  return {
    evaluatorId: evaluator.id,
    graph: {
      nodes: [evaluator, result],
      edges: [
        {
          id: "evaluator-true-result",
          source: evaluator.id,
          target: result.id,
          sourceHandle: "evaluator-true",
          targetHandle: null,
          data: {
            sourceKind: evaluator.data.kind,
            targetKind: result.data.kind,
          },
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
      document: {
        id: "doc-1",
        name: "Workflow",
        version: 1,
        metadata: {},
      },
    },
  }
}

function renderWithStore(
  children: ReactNode,
  initialGraph: WorkflowGraphState
) {
  return render(
    <WorkflowStoreProvider initialGraph={initialGraph}>
      {children}
    </WorkflowStoreProvider>
  )
}

describe("OutputQuickAddAffordance", () => {
  afterEach(() => {
    cleanup()
  })

  it("hides connected evaluator branch quick add and leaves unconnected branch available", () => {
    const { evaluatorId, graph } = createEvaluatorGraph()

    renderWithStore(
      <>
        <OutputQuickAddAffordance
          nodeId={evaluatorId}
          sourceHandle="evaluator-true"
          label="true"
        />
        <OutputQuickAddAffordance
          nodeId={evaluatorId}
          sourceHandle="evaluator-false"
          label="false"
        />
      </>,
      graph
    )

    expect(
      screen.queryByRole("button", {
        name: `Quick add from ${evaluatorId}:evaluator-true`,
      })
    ).toBeNull()
    expect(
      screen.getByRole("button", {
        name: `Quick add from ${evaluatorId}:evaluator-false`,
      })
    ).not.toBeNull()
  })
})
