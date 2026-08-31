// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { CircleIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { defineNode } from "./define-node"
import type { NodeDefinition } from "./define-node"
import { buildNodeTypes } from "./node-types-builder"
import type { WorkflowNodeData } from "../types/types"
import { WorkflowStoreProvider } from "../store"

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
})
