// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { Position } from "@xyflow/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WorkflowEdgeComponent } from "./workflow-edge"

vi.mock("@xyflow/react", async () => {
  const actual =
    await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react")

  return {
    ...actual,
    BaseEdge: ({ id, path }: { id: string; path: string }) => (
      <path data-testid={`base-edge-${id}`} d={path} />
    ),
    EdgeLabelRenderer: ({ children }: { children?: ReactNode }) => (
      <>{children}</>
    ),
    getBezierPath: vi.fn(() => ["M 10 20 C 30 20 50 60 70 60", 40, 40]),
  }
})

const edgeProps = {
  id: "edge-1",
  source: "source",
  target: "target",
  sourceX: 10,
  sourceY: 20,
  targetX: 70,
  targetY: 60,
  selected: false,
  animated: false,
  selectable: true,
  deletable: true,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  sourceHandleId: null,
  targetHandleId: null,
  markerEnd: undefined,
  style: undefined,
  data: {
    sourceKind: "inlineExpression",
    targetKind: "extractor",
  },
  onStartInsert: vi.fn(),
  onDeleteEdge: vi.fn(),
  isInsertPending: false,
}

describe("WorkflowEdgeComponent", () => {
  afterEach(() => {
    cleanup()
  })

  it("keeps Bezier rendering when route metadata is present", () => {
    render(
      <svg>
        <WorkflowEdgeComponent
          {...edgeProps}
          data={{
            ...edgeProps.data,
            route: {
              points: [
                { x: 10, y: 20 },
                { x: 40, y: 20 },
                { x: 40, y: 80 },
                { x: 80, y: 80 },
              ],
            },
          }}
        />
      </svg>
    )

    expect(screen.getByTestId("base-edge-edge-1").getAttribute("d")).toBe(
      "M 10 20 C 30 20 50 60 70 60"
    )
    const toolbarContainer = screen.getByRole("button", {
      name: "Insert node on edge edge-1",
    }).parentElement?.parentElement
    expect(toolbarContainer?.getAttribute("style")).toContain(
      "translate(40px, 40px)"
    )
  })

  it("renders Bezier when route data is missing", () => {
    render(
      <svg>
        <WorkflowEdgeComponent {...edgeProps} />
      </svg>
    )

    expect(screen.getByTestId("base-edge-edge-1").getAttribute("d")).toBe(
      "M 10 20 C 30 20 50 60 70 60"
    )
  })

  it("keeps Bezier rendering when route data is malformed", () => {
    render(
      <svg>
        <WorkflowEdgeComponent
          {...edgeProps}
          data={{
            ...edgeProps.data,
            route: {
              points: [{ x: 10, y: 20 }],
            },
          }}
        />
      </svg>
    )

    expect(screen.getByTestId("base-edge-edge-1").getAttribute("d")).toBe(
      "M 10 20 C 30 20 50 60 70 60"
    )
  })
})
