// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { ReactFlowProvider, type Node } from "@xyflow/react"
import type { MouseEvent, ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { toGroupFrameId } from "../../groups/group-canvas-ids"
import { GROUP_FRAME_PADDING } from "../../groups/group-geometry"
import type {
  WorkflowCanvasMode,
  WorkflowEdge,
  WorkflowGroup,
  WorkflowNode,
} from "../../types"
import { useGroupCanvasProjection } from "./use-group-canvas-projection"

function node(id: string, x: number, groupId?: string): WorkflowNode {
  return {
    id,
    position: { x, y: 100 },
    measured: { width: 100, height: 50 },
    data: {
      kind: "result",
      label: id,
      config: {},
      ...(groupId ? { groupId } : {}),
    },
  }
}

function group(collapsed: boolean): WorkflowGroup {
  return {
    id: "g",
    label: "G",
    color: "blue",
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    collapsed,
  }
}

const NODES = [node("a", 100, "g"), node("b", 200, "g"), node("x", 900)]
const EDGES: WorkflowEdge[] = [
  {
    id: "a-x",
    source: "a",
    target: "x",
    data: { sourceKind: "", targetKind: "" },
  },
]

function wrapper({ children }: { children: ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

function setup(options: {
  collapsed?: boolean
  mode?: WorkflowCanvasMode
  selectedGroupIds?: string[]
}) {
  const callbacks = {
    onSelectGroups: vi.fn(),
    onSelectNodes: vi.fn(),
    onResizeGroup: vi.fn(),
    onSetGroupCollapsed: vi.fn(),
  }
  const hook = renderHook(
    ({ mode }: { mode: WorkflowCanvasMode }) =>
      useGroupCanvasProjection({
        nodes: NODES,
        edges: EDGES,
        groups: [group(options.collapsed ?? false)],
        selectedGroupIds: options.selectedGroupIds ?? [],
        mode,
        ...callbacks,
      }),
    { wrapper, initialProps: { mode: options.mode ?? "edit" } }
  )
  return { ...callbacks, ...hook }
}

const click = (modifiers: Partial<MouseEvent> = {}) =>
  ({
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    ...modifiers,
  }) as MouseEvent

describe("useGroupCanvasProjection", () => {
  it("draws an expanded group as a frame before the nodes", () => {
    const { result } = setup({})
    const [first, ...rest] = result.current.canvasNodes
    expect(first?.id).toBe(toGroupFrameId("g"))
    expect(first?.type).toBe("groupFrame")
    expect(rest.map((n) => n.id)).toEqual(["a", "b", "x"])
    expect(result.current.canvasEdges).toBe(EDGES)
  })

  it("hides the members of a collapsed group behind a card and a proxy edge", () => {
    const { result } = setup({ collapsed: true })
    expect(result.current.canvasNodes[0]?.type).toBe("groupCard")
    expect(
      result.current.visibleNodes.map((n) => [n.id, Boolean(n.hidden)])
    ).toEqual([
      ["a", true],
      ["b", true],
      ["x", false],
    ])
    expect(result.current.canvasEdges[0]?.source).toBe(toGroupFrameId("g"))
  })

  it("collapses through the workflow in edit mode", () => {
    const { result, onSetGroupCollapsed } = setup({})
    act(() => result.current.groupContext.setCollapsed("g", true))
    expect(onSetGroupCollapsed).toHaveBeenCalledWith("g", true)
  })

  it("expands locally in observe mode without touching the workflow", () => {
    const { result, onSetGroupCollapsed, rerender } = setup({
      collapsed: true,
      mode: "observe",
    })

    act(() => result.current.groupContext.setCollapsed("g", false))

    expect(onSetGroupCollapsed).not.toHaveBeenCalled()
    expect(result.current.canvasNodes[0]?.type).toBe("groupFrame")

    // The override belongs to that observing session.
    rerender({ mode: "edit" })
    rerender({ mode: "observe" })
    expect(result.current.canvasNodes[0]?.type).toBe("groupCard")
  })

  it("expands the group of a revealed hidden member", () => {
    const edit = setup({ collapsed: true })
    let wasHidden = false
    act(() => {
      wasHidden = edit.result.current.expandGroupOf("a")
    })
    expect(wasHidden).toBe(true)
    expect(edit.onSetGroupCollapsed).toHaveBeenCalledWith("g", false)
    expect(edit.result.current.expandGroupOf("x")).toBe(false)

    const observe = setup({ collapsed: true, mode: "observe" })
    act(() => {
      observe.result.current.expandGroupOf("a")
    })
    expect(observe.onSetGroupCollapsed).not.toHaveBeenCalled()
    expect(observe.result.current.canvasNodes[0]?.type).toBe("groupFrame")
  })

  it("selects a group from its header and toggles it with a modifier", () => {
    const frameNode = { id: toGroupFrameId("g") } as Node
    const plain = setup({})
    plain.result.current.onNodeClick(click(), frameNode)
    expect(plain.onSelectNodes).toHaveBeenCalledWith([])
    expect(plain.onSelectGroups).toHaveBeenCalledWith(["g"])

    const toggled = setup({ selectedGroupIds: ["g"] })
    toggled.result.current.onNodeClick(click({ shiftKey: true }), frameNode)
    expect(toggled.onSelectGroups).toHaveBeenCalledWith([])
  })

  it("clears selected groups on a plain node click, keeps them with a modifier", () => {
    const { result, onSelectGroups } = setup({ selectedGroupIds: ["g"] })
    result.current.onNodeClick(click({ metaKey: true }), { id: "x" } as Node)
    expect(onSelectGroups).not.toHaveBeenCalled()
    result.current.onNodeClick(click(), { id: "x" } as Node)
    expect(onSelectGroups).toHaveBeenCalledWith([])
  })

  it("clears selected groups when an unselected node is dragged without a modifier", () => {
    const { result, onSelectGroups } = setup({ selectedGroupIds: ["g"] })
    result.current.onNodeDragStart(click({ metaKey: true }), {
      id: "x",
    } as Node)
    expect(onSelectGroups).not.toHaveBeenCalled()
    result.current.onNodeDragStart(click(), { id: toGroupFrameId("g") } as Node)
    expect(onSelectGroups).not.toHaveBeenCalled()
    result.current.onNodeDragStart(click(), { id: "x" } as Node)
    expect(onSelectGroups).toHaveBeenCalledWith([])
  })

  it("previews a resize clamped to the members and commits it at the end", () => {
    const { result, onResizeGroup } = setup({})
    act(() =>
      result.current.onGroupResize("g", { x: 0, y: 0, width: 50, height: 300 })
    )
    expect(result.current.canvasNodes[0]?.width).toBe(
      200 + 100 + GROUP_FRAME_PADDING
    )

    const rect = { x: 0, y: 0, width: 50, height: 300 }
    act(() => result.current.onGroupResizeEnd("g", rect))
    expect(onResizeGroup).toHaveBeenCalledWith("g", rect)
    expect(result.current.canvasNodes[0]?.width).toBe(400)
  })
})
