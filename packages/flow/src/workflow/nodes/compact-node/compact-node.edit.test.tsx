// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  appendExpressionText,
  blurExpressionEditor,
} from "@flow/expression-editor/testing"
import type { NodeProps } from "@xyflow/react"
import { useEffect } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { builtinDefinitions } from "../../node-registry/builtin-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { buildNodeTypes } from "../../node-registry/node-types-builder"
import { createNodeRegistry } from "../../node-registry/registry"
import {
  useWorkflowStoreApi,
  WorkflowStoreProvider,
  type WorkflowStoreState,
} from "../../store"
import type { WorkflowNode } from "../../types"

const flowState = {
  transform: [0, 0, 1] as [number, number, number],
  width: 0,
  height: 0,
  nodeLookup: new Map(),
}

vi.mock("@xyflow/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@xyflow/react")>()),
  Handle: () => null,
  useStore: (selector: (state: typeof flowState) => unknown) =>
    selector(flowState),
}))

vi.mock("../output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

const registry = createNodeRegistry(builtinDefinitions)
const nodeTypes = buildNodeTypes(builtinDefinitions)

function nodeProps(node: WorkflowNode): NodeProps {
  return {
    id: node.id,
    type: node.data.kind,
    data: node.data,
    selected: false,
    dragging: false,
    zIndex: 1,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

describe("editing a node that goes compact", () => {
  afterEach(() => {
    cleanup()
    flowState.transform = [0, 0, 1]
  })

  it("keeps an expression typed before zooming out and clicking away", async () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    node.data.config.valueExpression = "a"
    let getState: (() => WorkflowStoreState) | null = null
    function CaptureApi() {
      const storeApi = useWorkflowStoreApi()
      useEffect(() => {
        getState = storeApi.getState
      }, [storeApi])
      return null
    }
    const View = nodeTypes.setVariable!
    const tree = () => (
      <WorkflowStoreProvider
        definitions={builtinDefinitions}
        initialGraph={{
          nodes: [node],
          edges: [],
          groups: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          document: { id: "doc", name: "Doc", version: 1, metadata: {} },
        }}
      >
        <CaptureApi />
        <View {...nodeProps(node)} />
      </WorkflowStoreProvider>
    )
    const { container, rerender } = render(tree())

    // Nodes mount compact, then fill in their full view.
    const preview = await waitFor(() => {
      const element = container.querySelector<HTMLElement>(
        "[data-expression-preview]"
      )
      expect(element).not.toBeNull()
      return element!
    })
    fireEvent.pointerDown(preview)
    act(() => {
      appendExpressionText(container, "b")
    })

    // Zoomed out while editing: the node holds its full view...
    flowState.transform = [0, 0, 0.2]
    rerender(tree())
    expect(screen.queryByTestId("workflow-node-compact")).toBeNull()

    // ...until focus leaves it, and the swap must not drop the edit.
    act(() => {
      blurExpressionEditor(container)
    })

    expect(screen.getByTestId("workflow-node-compact")).toBeTruthy()
    expect(getState!().graph.nodes[0]?.data.config.valueExpression).toBe("ab")
  })
})
