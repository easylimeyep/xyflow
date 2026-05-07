// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { Circle } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { buildNodeTypes } from "./node-types-builder"
import type { NodeDefinition } from "./define-node"
import { WorkflowStoreProvider } from "../store"

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("../nodes/output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

const testDefinition = {
  kind: "testNode",
  title: "Test Node",
  description: "Test node definition",
  icon: Circle,
  category: "data",
  fields: [],
  buildDefaultConfig: () => ({}),
  outputPaths: [],
  allowedTargets: [],
} satisfies NodeDefinition<"testNode">

function CustomNode() {
  return <div>Custom node</div>
}

const nodeProps = {
  id: "test-node",
  type: "testNode",
  data: {
    kind: "testNode",
    label: "Test Node",
    config: {},
  },
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

describe("buildNodeTypes", () => {
  it("uses explicit client component bindings", () => {
    const nodeTypes = buildNodeTypes([testDefinition], {
      testNode: CustomNode,
    })

    const GeneratedNode = nodeTypes.testNode
    expect(GeneratedNode).toBeDefined()
    if (!GeneratedNode) {
      throw new Error("Expected generated node type")
    }

    const { container } = render(
      <WorkflowStoreProvider>
        <GeneratedNode {...nodeProps} />
      </WorkflowStoreProvider>
    )

    expect(container.textContent).toContain("Custom node")
  })

  it("falls back to DefaultNodeRenderer when no component binding exists", () => {
    const nodeTypes = buildNodeTypes([testDefinition], {})
    const GeneratedNode = nodeTypes.testNode

    expect(GeneratedNode).toBeDefined()
    if (!GeneratedNode) {
      throw new Error("Expected generated node type")
    }

    const { container } = render(
      <WorkflowStoreProvider>
        <GeneratedNode {...nodeProps} />
      </WorkflowStoreProvider>
    )

    expect(container.textContent).toContain("Test Node")
  })
})
