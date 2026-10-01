// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { CircleIcon } from "lucide-react"
import { useEffect } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { defineNode } from "./define-node"
import type { NodeDefinition } from "./define-node"
import { buildNodeTypes } from "./node-types-builder"
import type { WorkflowNodeData } from "../types/types"
import {
  useWorkflowStoreApi,
  WorkflowStoreProvider,
  type WorkflowStoreState,
} from "../store"

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock(
  "../nodes/output-quick-add-affordance/output-quick-add-affordance",
  () => ({
    OutputQuickAddAffordance: () => null,
  })
)

function BespokeNode(_props: NodeProps) {
  return <div>bespoke</div>
}

const withView = defineNode({
  kind: "withView",
  title: "With view",
  description: "",
  icon: CircleIcon,
  category: "logic",
  fields: [],
  buildDefaultConfig: () => ({}),
  outputPaths: [],
  allowedTargets: [],
  view: BespokeNode,
})

const withoutView = defineNode({
  kind: "withoutView",
  title: "Without view",
  description: "",
  icon: CircleIcon,
  category: "logic",
  fields: [],
  buildDefaultConfig: () => ({}),
  outputPaths: [],
  allowedTargets: [],
})

function nodeProps(data: WorkflowNodeData): NodeProps {
  return {
    id: "test-node",
    type: data.kind,
    data,
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

describe("buildNodeTypes", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a definition's own view when it declares one", () => {
    const types = buildNodeTypes([withView])
    const Rendered = types.withView
    expect(Rendered).toBeDefined()
    if (!Rendered) {
      throw new Error("Expected generated node type")
    }
    render(
      <WorkflowStoreProvider>
        <Rendered
          {...nodeProps({ kind: "withView", label: "With view", config: {} })}
        />
      </WorkflowStoreProvider>
    )
    expect(screen.getByText("bespoke")).toBeInstanceOf(HTMLElement)
  })

  it("falls back to the generic renderer when a definition declares no view", () => {
    const types = buildNodeTypes([withoutView])
    expect(types.withoutView).toBeTypeOf("function")

    const Rendered = types.withoutView
    if (!Rendered) {
      throw new Error("Expected generated node type")
    }
    render(
      <WorkflowStoreProvider>
        <Rendered
          {...nodeProps({
            kind: "withoutView",
            label: "Without view",
            config: {},
          })}
        />
      </WorkflowStoreProvider>
    )
    expect(screen.getByText("Without view")).toBeInstanceOf(HTMLElement)
  })

  it("marks a generic-renderer node that matches the canvas search", () => {
    const Rendered = buildNodeTypes([withoutView]).withoutView!
    let getState: (() => WorkflowStoreState) | null = null
    function CaptureApi() {
      const storeApi = useWorkflowStoreApi()
      useEffect(() => {
        getState = storeApi.getState
      }, [storeApi])
      return null
    }
    const data = { kind: "withoutView", label: "Needle", config: {} }
    render(
      <WorkflowStoreProvider
        definitions={[withoutView]}
        initialGraph={{
          nodes: [{ id: "test-node", position: { x: 0, y: 0 }, data }],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          document: { id: "doc", name: "Doc", version: 1, metadata: {} },
        }}
      >
        <CaptureApi />
        <Rendered {...nodeProps(data)} />
      </WorkflowStoreProvider>
    )

    act(() => {
      getState!().openSearch()
      getState!().setSearchQuery("needle")
    })

    expect(screen.getByTestId("workflow-node").dataset.searchState).toBe(
      "current"
    )
  })

  it("keeps the strong mark on a generic-renderer node whose match is in a field", () => {
    const withExpression = defineNode({
      ...withoutView,
      kind: "withExpression",
      fields: [
        { key: "body", label: "Body", type: "textarea", ui: "expression" },
      ],
      buildDefaultConfig: () => ({ body: "" }),
    })
    const Rendered = buildNodeTypes([withExpression]).withExpression!
    let getState: (() => WorkflowStoreState) | null = null
    function CaptureApi() {
      const storeApi = useWorkflowStoreApi()
      useEffect(() => {
        getState = storeApi.getState
      }, [storeApi])
      return null
    }
    const data = {
      kind: "withExpression",
      label: "Host",
      config: { body: "{{ needle }}" },
    }
    render(
      <WorkflowStoreProvider
        definitions={[withExpression]}
        initialGraph={{
          nodes: [{ id: "test-node", position: { x: 0, y: 0 }, data }],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          document: { id: "doc", name: "Doc", version: 1, metadata: {} },
        }}
      >
        <CaptureApi />
        <Rendered {...nodeProps(data)} />
      </WorkflowStoreProvider>
    )

    act(() => {
      getState!().openSearch()
      getState!().setSearchQuery("needle")
    })

    const node = screen.getByTestId("workflow-node")
    expect(node.dataset.searchState).toBe("current")
    expect(node.firstElementChild?.className).toContain("ring-[3px]")
  })
})
