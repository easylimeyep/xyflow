// @vitest-environment jsdom

import { render } from "@testing-library/react"
import type { NodeChange } from "@xyflow/react"
import { useEffect, type ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"

import { toGroupFrameId } from "../../groups/group-canvas-ids"
import type { Rect } from "../../groups/group-geometry"
import type { WorkflowGroup, WorkflowNode } from "../../types"
import { useNodeChangeRouter } from "./use-node-change-router"

type Route = (changes: NodeChange<WorkflowNode>[]) => void

const GROUP: WorkflowGroup = {
  id: "g",
  label: "G",
  color: "blue",
  x: 100,
  y: 50,
  width: 400,
  height: 300,
  collapsed: false,
}
const FRAME = toGroupFrameId("g")

function Harness({
  onRouter,
  onStructuralChanges,
  onSelectionChange,
  onGroupResize,
  onGroupResizeEnd,
}: {
  onRouter: (route: Route) => void
  onStructuralChanges: (changes: NodeChange<WorkflowNode>[]) => void
  onSelectionChange: (ids: string[]) => void
  onGroupResize: (groupId: string, rect: Rect) => void
  onGroupResizeEnd: (groupId: string, rect: Rect) => void
}): ReactElement {
  const route = useNodeChangeRouter({
    nodes: [],
    groups: [GROUP],
    onStructuralChanges,
    onSelectionChange,
    onGroupResize,
    onGroupResizeEnd,
  })
  useEffect(() => onRouter(route), [onRouter, route])
  return <div />
}

function setup() {
  const handlers = {
    onStructuralChanges: vi.fn(),
    onSelectionChange: vi.fn(),
    onGroupResize: vi.fn(),
    onGroupResizeEnd: vi.fn(),
  }
  let route: Route = () => {}
  render(<Harness {...handlers} onRouter={(r) => (route = r)} />)
  return {
    ...handlers,
    route: (changes: NodeChange<WorkflowNode>[]) => route(changes),
  }
}

describe("useNodeChangeRouter with group frames", () => {
  it("passes a frame drag through to the store with the node changes", () => {
    const { route, onStructuralChanges, onGroupResize } = setup()
    const changes: NodeChange<WorkflowNode>[] = [
      {
        id: FRAME,
        type: "position",
        position: { x: 120, y: 60 },
        dragging: true,
      },
      { id: "n", type: "position", position: { x: 0, y: 0 }, dragging: true },
    ]

    route(changes)

    expect(onStructuralChanges).toHaveBeenCalledWith(changes)
    expect(onGroupResize).not.toHaveBeenCalled()
  })

  it("treats a left-edge resize as a resize, never as a move", () => {
    const { route, onStructuralChanges, onGroupResize } = setup()

    // What React Flow's resizer emits when the left edge is dragged.
    route([
      { id: FRAME, type: "position", position: { x: 40, y: 50 } },
      {
        id: FRAME,
        type: "dimensions",
        resizing: true,
        setAttributes: true,
        dimensions: { width: 460, height: 300 },
      },
    ])

    expect(onStructuralChanges).not.toHaveBeenCalled()
    expect(onGroupResize).toHaveBeenCalledWith("g", {
      x: 40,
      y: 50,
      width: 460,
      height: 300,
    })
  })

  it("commits the last resize rectangle when the resize ends", () => {
    const { route, onGroupResizeEnd } = setup()

    route([
      { id: FRAME, type: "position", position: { x: 40, y: 50 } },
      {
        id: FRAME,
        type: "dimensions",
        resizing: true,
        dimensions: { width: 460, height: 300 },
      },
    ])
    route([
      {
        id: FRAME,
        type: "dimensions",
        resizing: false,
        dimensions: { width: 460, height: 300 },
      },
    ])

    expect(onGroupResizeEnd).toHaveBeenCalledWith("g", {
      x: 40,
      y: 50,
      width: 460,
      height: 300,
    })
  })

  it("ignores a frame's measurement, selection, and removal", () => {
    const { route, onStructuralChanges, onSelectionChange, onGroupResize } =
      setup()

    route([
      {
        id: FRAME,
        type: "dimensions",
        dimensions: { width: 400, height: 300 },
      },
      { id: FRAME, type: "select", selected: true },
      { id: FRAME, type: "remove" },
    ])

    expect(onStructuralChanges).not.toHaveBeenCalled()
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(onGroupResize).not.toHaveBeenCalled()
  })
})
