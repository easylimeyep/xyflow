// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { useEffect, type ComponentType, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import {
  useWorkflowStoreApi,
  WorkflowStoreProvider,
  type WorkflowRuntimeConfig,
  type WorkflowStoreState,
} from "../store"
import type { WorkflowNode } from "../types"
import { ExtractorNode } from "./data/extractor/component"
import { InlineExpressionNode } from "./data/inline-expression/component"
import { SetVariableNode } from "./data/set-variable/component"
import { EvaluatorNode } from "./logic/evaluator/component"
import { JsonEvaluatorNode } from "./logic/json-evaluator/component"

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Left: "left", Right: "right" },
}))

vi.mock("@flow/ui/components/sortable", () => ({
  Sortable: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SortableContent: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  SortableItem: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  SortableItemHandle: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  SortableOverlay: () => null,
}))

vi.mock("./output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

const registry = createNodeRegistry(builtinBaseDefinitions)

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

/** Renders one node view in a real store and searches for `query`. */
function renderSearched(
  node: WorkflowNode,
  View: ComponentType<NodeProps>,
  query: string,
  runtime?: WorkflowRuntimeConfig
) {
  let getState: (() => WorkflowStoreState) | null = null
  function CaptureApi() {
    const storeApi = useWorkflowStoreApi()
    useEffect(() => {
      getState = storeApi.getState
    }, [storeApi])
    return null
  }

  const { container } = render(
    <WorkflowStoreProvider
      definitions={builtinBaseDefinitions}
      runtime={runtime}
      initialGraph={{
        nodes: [node],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        document: { id: "doc", name: "Doc", version: 1, metadata: {} },
      }}
    >
      <CaptureApi />
      <View {...nodeProps(node)} />
    </WorkflowStoreProvider>
  )
  act(() => {
    getState!().openSearch()
    getState!().setSearchQuery(query)
  })

  return {
    container,
    next: () => act(() => getState!().searchNext()),
  }
}

/** The search mark on the field wrapping `element`, if any. */
function markOf(element: Element | null): string | undefined {
  return (
    element?.closest<HTMLElement>("[data-field-search-state]")?.dataset
      .fieldSearchState ?? undefined
  )
}

describe("field search marks in node views", () => {
  afterEach(() => {
    cleanup()
  })

  it("moves the setter's mark from the title to the variable name", () => {
    const setter = createWorkflowNode(
      registry,
      "setVariable",
      { x: 0, y: 0 },
      "Calc price"
    )
    setter.data.config.variableName = "price"
    setter.data.config.valueExpression = "{{ price * 2 }}"
    const { container, next } = renderSearched(setter, SetVariableNode, "price")
    const title = screen.getByText("Calc price")
    const variableInput = screen.getByDisplayValue("price")
    const valueEditor = container.querySelector(".cm-editor")

    expect(markOf(title)).toBe("current")
    expect(markOf(variableInput)).toBe("match")
    expect(markOf(valueEditor)).toBe("match")

    next()

    expect(markOf(title)).toBe("match")
    expect(markOf(variableInput)).toBe("current")
  })

  it("marks the extractor's own variable name", () => {
    const extractor = createWorkflowNode(
      registry,
      "extractor",
      { x: 0, y: 0 },
      "Extract"
    )
    extractor.data.config.extractExpression = "price"
    renderSearched(extractor, ExtractorNode, "price")

    expect(markOf(screen.getByDisplayValue("price"))).toBe("current")
  })

  it("marks only the inline token row holding the reference", () => {
    const inline = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      "Inline"
    )
    inline.data.config.template = ["{{ a }}", "{{ price }}"]
    const { container } = renderSearched(inline, InlineExpressionNode, "price")
    const [first, second] = container.querySelectorAll(".cm-editor")

    expect(markOf(first!)).toBeUndefined()
    expect(markOf(second!)).toBe("current")
  })

  it("marks an array operand on its trigger and a value operand on its input", () => {
    const evaluator = createWorkflowNode(
      registry,
      "evaluator",
      { x: 0, y: 0 },
      "Check"
    )
    evaluator.data.config.conditions = [
      {
        id: "c1",
        left: { type: "array", value: ["{{ a }}", "{{ price }}"] },
        operator: "is equal to",
        right: { type: "value", value: "{{ price }}" },
      },
    ]
    const { container } = renderSearched(evaluator, EvaluatorNode, "price")
    const marks = Array.from(
      container.querySelectorAll<HTMLElement>("[data-field-search-state]")
    ).map((element) => element.dataset.fieldSearchState)

    // Left array (collapsed, marked on its trigger) is first; the right value
    // operand's own input follows.
    expect(marks).toEqual(["current", "match"])
    expect(
      screen
        .getByTestId("workflow-node")
        .firstElementChild?.className.includes("ring-[3px]")
    ).toBe(false)
  })

  it("keeps the strong node mark for a match in a hidden condition", () => {
    const evaluator = createWorkflowNode(
      registry,
      "evaluator",
      { x: 0, y: 0 },
      "Check"
    )
    const condition = (id: string, left: string) => ({
      id,
      left: { type: "value", value: left },
      operator: "is equal to",
      right: { type: "value", value: "1" },
    })
    evaluator.data.config.conditions = [
      condition("shown", "{{ a }}"),
      condition("hidden", "{{ price }}"),
    ]
    renderSearched(evaluator, EvaluatorNode, "price", {
      enableEvaluatorMultipleConditions: false,
    })
    const node = screen.getByTestId("workflow-node")

    expect(node.dataset.searchState).toBe("current")
    expect(node.firstElementChild?.className).toContain("ring-[3px]")
    expect(node.querySelector("[data-field-search-state]")).toBeNull()
  })

  it("keeps the strong node mark for an operand the row shows as a badge", () => {
    const jsonEvaluator = createWorkflowNode(
      registry,
      "jsonEvaluator",
      { x: 0, y: 0 },
      "Json check"
    )
    // Imported data: a typed left operand on a kind whose rows always show
    // the upstream badge in its place.
    jsonEvaluator.data.config.conditions = [
      {
        id: "c1",
        left: { type: "value", value: "{{ price }}" },
        operator: "is equal to",
        right: { type: "value", value: "1" },
      },
    ]
    renderSearched(jsonEvaluator, JsonEvaluatorNode, "price")
    const node = screen.getByTestId("workflow-node")

    expect(node.dataset.searchState).toBe("current")
    expect(node.firstElementChild?.className).toContain("ring-[3px]")
  })
})
