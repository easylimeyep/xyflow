// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { WorkflowStoreProvider, useWorkflowStore } from "../../store"
import type { WorkflowGraphState } from "../../types"
import { NodeContextMenu } from "./node-context-menu"

const clipboardWriteTextMock = vi.fn()

function TestNode() {
  return <div data-testid="node-context-target">Node</div>
}

function SelectionProbe() {
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds)
  return <div data-testid="selected-node-ids">{selectedNodeIds.join(",")}</div>
}

function createNodeProps(overrides: Partial<NodeProps> = {}): NodeProps {
  return {
    id: "node-1",
    type: "setVariable",
    data: {
      kind: "setVariable",
      label: "Setter",
      config: { variableName: "myVar", valueExpression: "" },
    },
    selected: false,
    dragging: false,
    zIndex: 1,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    sourcePosition: undefined,
    targetPosition: undefined,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    ...overrides,
  }
}

function createInitialGraph(): WorkflowGraphState {
  return {
    nodes: [
      {
        id: "node-1",
        type: "setVariable",
        position: { x: 0, y: 0 },
        data: {
          kind: "setVariable",
          label: "Setter",
          config: { variableName: "myVar", valueExpression: "" },
        },
      },
      {
        id: "node-2",
        type: "extractor",
        position: { x: 240, y: 0 },
        data: {
          kind: "extractor",
          label: "Extractor",
          config: { tokenNumber: 1, extractExpression: "", unlimited: false },
        },
        selected: true,
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: {
      id: "test",
      name: "Test",
      version: 1,
      metadata: {},
    },
  }
}

describe("NodeContextMenu", () => {
  beforeEach(() => {
    clipboardWriteTextMock.mockReset()
    clipboardWriteTextMock.mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, "clipboard", {
      value: {
        writeText: clipboardWriteTextMock,
        readText: vi.fn().mockResolvedValue(""),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("renders copy, duplicate, and destructive delete commands with shortcut hints", async () => {
    render(
      <WorkflowStoreProvider initialGraph={createInitialGraph()}>
        <NodeContextMenu {...createNodeProps()}>{TestNode}</NodeContextMenu>
      </WorkflowStoreProvider>
    )

    fireEvent.contextMenu(screen.getByTestId("node-context-target"))

    expect(await screen.findByText("Copy")).toBeDefined()
    expect(screen.getByText("Ctrl+C")).toBeDefined()
    expect(screen.getByText("Duplicate")).toBeDefined()
    expect(screen.getByText("Ctrl+D")).toBeDefined()
    expect(screen.getByText("Delete")).toBeDefined()
    expect(screen.getByText("Backspace")).toBeDefined()
    expect(
      screen.getByText("Delete").closest("[data-variant]")?.getAttribute(
        "data-variant"
      )
    ).toBe("destructive")
  })

  it("selects an unselected right-clicked node before applying menu actions", async () => {
    render(
      <WorkflowStoreProvider initialGraph={createInitialGraph()}>
        <SelectionProbe />
        <NodeContextMenu {...createNodeProps()}>{TestNode}</NodeContextMenu>
      </WorkflowStoreProvider>
    )

    expect(screen.getByTestId("selected-node-ids").textContent).toBe("")

    fireEvent.contextMenu(screen.getByTestId("node-context-target"))

    expect(await screen.findByText("Copy")).toBeDefined()
    expect(screen.getByTestId("selected-node-ids").textContent).toBe("node-1")
  })
})
