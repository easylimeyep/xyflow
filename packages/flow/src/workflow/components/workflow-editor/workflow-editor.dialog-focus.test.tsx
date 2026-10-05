// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, type ReactNode } from "react"
import { Dialog, DialogTitle } from "@flow/ui/components/dialog"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import {
  navigatorClipboardAdapter,
  setClipboardAdapter,
} from "../../store/clipboard-io"
import type { WorkflowGraphState } from "../../types"
import { WorkflowEditor } from "./workflow-editor"

vi.mock("../workflow-minimap", () => ({ WorkflowMiniMap: () => null }))

// The real React Flow needs a measuring DOM jsdom does not have. This suite
// keeps the real canvas wrapper (where the focus handling lives) and swaps
// only the React Flow surface for a node body and the overlay children.
vi.mock("@xyflow/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@xyflow/react")>()),
  ReactFlowProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  ReactFlow: ({ children }: { children: ReactNode }) => (
    <div>
      <div data-testid="node-body">Inline node</div>
      {children}
    </div>
  ),
  NodeToolbar: ({
    children,
    isVisible,
  }: {
    children: ReactNode
    isVisible?: boolean
  }) => (isVisible ? <div>{children}</div> : null),
  Background: () => null,
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useReactFlow: () => ({
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    getZoom: () => 1,
    getInternalNode: () => undefined,
    setCenter: vi.fn(),
    screenToFlowPosition: (position: { x: number; y: number }) => position,
  }),
  useStore: (
    selector: (state: { transform: [number, number, number] }) => unknown
  ) => selector({ transform: [0, 0, 1] }),
  useStoreApi: () => ({
    subscribe: () => () => {},
    getState: () => ({ nodesSelectionActive: false }),
    setState: () => {},
  }),
  useNodesInitialized: () => true,
}))

const registry = createNodeRegistry(builtinBaseDefinitions)
const node = {
  ...createWorkflowNode(registry, "inlineExpression", { x: 0, y: 0 }, "Hello"),
  id: "node-a",
}
const secondNode = {
  ...createWorkflowNode(
    registry,
    "inlineExpression",
    { x: 0, y: 200 },
    "World"
  ),
  id: "node-b",
}
const graph: WorkflowGraphState = {
  nodes: [node, secondNode],
  edges: [],
  groups: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  document: { id: "doc", name: "Doc", version: 1, metadata: {} },
}

const writeTextMock = vi.fn<(text: string) => Promise<boolean>>(
  async () => true
)

const SELECTED_NODE_IDS = [node.id, secondNode.id]

/** Selects both nodes: the toolbar only shows for a multi-node selection. */
function SelectNodes() {
  const setSelectedNodes = WorkflowEditor.use.store(
    (state) => state.setSelectedNodes
  )
  useEffect(() => {
    setSelectedNodes(SELECTED_NODE_IDS)
  }, [setSelectedNodes])
  return null
}

function NodeCount() {
  const count = WorkflowEditor.use.store((state) => state.graph.nodes.length)
  return <output data-testid="node-count">{count}</output>
}

/** The editor hosted the way consumers host it: inside a focus-trapping modal. */
function renderEditorInModal() {
  return render(
    <Dialog isOpen showCloseButton={false}>
      <DialogTitle>Workflow editor</DialogTitle>
      <WorkflowEditor initialGraph={graph} definitions={builtinBaseDefinitions}>
        <SelectNodes />
        <NodeCount />
        <WorkflowEditor.Canvas />
        <input aria-label="config field" />
      </WorkflowEditor>
    </Dialog>
  )
}

describe("WorkflowEditor hosted in a react-aria modal", () => {
  beforeEach(() => {
    writeTextMock.mockClear()
    setClipboardAdapter({
      writeText: writeTextMock,
      readText: async () => null,
    })
  })

  afterEach(() => {
    cleanup()
    setClipboardAdapter(navigatorClipboardAdapter)
  })

  it("leaves Ctrl+C to the field while the field has focus", async () => {
    const user = userEvent.setup()
    renderEditorInModal()

    await user.click(screen.getByLabelText("config field"))
    await user.keyboard("{Control>}c{/Control}")

    expect(writeTextMock).not.toHaveBeenCalled()
  })

  it("copies the selection with Ctrl+C after the node is pressed", async () => {
    const user = userEvent.setup()
    renderEditorInModal()

    await user.click(screen.getByLabelText("config field"))
    fireEvent.pointerDown(screen.getByTestId("node-body"))

    expect(
      (document.activeElement as HTMLElement).hasAttribute(
        "data-workflow-canvas-focus-target"
      )
    ).toBe(true)

    await user.keyboard("{Control>}c{/Control}")

    await waitFor(() => expect(writeTextMock).toHaveBeenCalledTimes(1))
    expect(String(writeTextMock.mock.calls[0]?.[0])).toContain("Hello")
  })

  it("keeps the hotkeys working after the toolbar deletes the selection", async () => {
    const user = userEvent.setup()
    renderEditorInModal()

    await user.click(await screen.findByRole("button", { name: "Delete" }))
    expect(screen.getByTestId("node-count").textContent).toBe("0")
    expect(
      (document.activeElement as HTMLElement).hasAttribute(
        "data-workflow-canvas-focus-target"
      )
    ).toBe(true)

    await user.keyboard("{Control>}z{/Control}")

    expect(screen.getByTestId("node-count").textContent).toBe("2")
  })

  it("offers the selection toolbar inside the modal", async () => {
    const user = userEvent.setup()
    renderEditorInModal()

    await user.click(await screen.findByRole("button", { name: "Copy" }))

    await waitFor(() => expect(writeTextMock).toHaveBeenCalledTimes(1))
  })
})
