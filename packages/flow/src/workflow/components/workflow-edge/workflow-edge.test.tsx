// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Position } from "@xyflow/react"
import type { CSSProperties, ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WorkflowEdgeComponent } from "./workflow-edge"

vi.mock("@xyflow/react", async () => {
  const actual =
    await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react")

  return {
    ...actual,
    BaseEdge: ({
      id,
      path,
      style,
    }: {
      id: string
      path: string
      style?: CSSProperties
    }) => (
      <path data-testid={`base-edge-${id}`} d={path} style={style} />
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

function expectBaseEdgeStyle(stroke: string, strokeWidth: string) {
  const style = screen.getByTestId("base-edge-edge-1").getAttribute("style")

  expect(style).toContain(`stroke: ${stroke}`)
  expect(style).toContain(`stroke-width: ${strokeWidth}`)
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
    expectBaseEdgeStyle("var(--border)", "2")
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

  it("highlights the edge with the primary stroke on hover", () => {
    render(
      <svg>
        <WorkflowEdgeComponent {...edgeProps} />
      </svg>
    )

    fireEvent.mouseEnter(screen.getByTestId("workflow-edge-edge-1"))

    expectBaseEdgeStyle("var(--primary)", "2.5")
  })

  it("keeps the edge highlighted while the toolbar is hovered", () => {
    render(
      <svg>
        <WorkflowEdgeComponent {...edgeProps} />
      </svg>
    )

    const edgeGroup = screen.getByTestId("workflow-edge-edge-1")
    const toolbar = screen.getByRole("button", {
      name: "Insert node on edge edge-1",
    }).parentElement

    fireEvent.mouseEnter(edgeGroup)
    fireEvent.mouseEnter(toolbar!)
    fireEvent.mouseLeave(edgeGroup)

    expectBaseEdgeStyle("var(--primary)", "2.5")
  })

  it("uses the active primary stroke for selected and insert-pending edges", () => {
    const { rerender } = render(
      <svg>
        <WorkflowEdgeComponent {...edgeProps} selected />
      </svg>
    )

    expectBaseEdgeStyle("var(--primary)", "2.5")

    rerender(
      <svg>
        <WorkflowEdgeComponent {...edgeProps} isInsertPending />
      </svg>
    )

    expectBaseEdgeStyle("var(--primary)", "2.5")
  })
})
