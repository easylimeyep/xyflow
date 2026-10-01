// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import { useEffect, type ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import {
  useWorkflowStoreApi,
  WorkflowStoreProvider,
  type WorkflowStoreState,
} from "../../store"
import {
  SearchFieldMark,
  SearchFieldRegistryProvider,
  SearchMarkedTitle,
  useNodeSearchMarks,
} from "./search-field-mark"

const registry = createNodeRegistry(builtinBaseDefinitions)

function setterNode() {
  const node = createWorkflowNode(
    registry,
    "setVariable",
    { x: 0, y: 0 },
    "price setter"
  )
  node.data.config.variableName = "price"
  node.data.config.valueExpression = "1"
  return { ...node, id: "s" }
}

/**
 * A minimal node view: the title always, the variable field only when
 * `showVariable` — the case of a field the search walks but a view hides.
 */
let viewRenders = 0

function NodeView({ showVariable }: { showVariable: boolean }) {
  const { fieldRegistry, searchState, hasCurrentSearchField } =
    useNodeSearchMarks("s")
  useEffect(() => {
    viewRenders += 1
  })
  return (
    <SearchFieldRegistryProvider value={fieldRegistry}>
      <div
        data-testid="node"
        data-search-state={searchState}
        data-has-current-field={String(hasCurrentSearchField)}
      >
        <SearchMarkedTitle nodeId="s">price setter</SearchMarkedTitle>
        {showVariable ? (
          <SearchFieldMark nodeId="s" fieldKey="variableName">
            <input defaultValue="price" />
          </SearchFieldMark>
        ) : null}
      </div>
    </SearchFieldRegistryProvider>
  )
}

function renderView(view: ReactNode) {
  let getState: (() => WorkflowStoreState) | null = null
  function CaptureApi() {
    const storeApi = useWorkflowStoreApi()
    useEffect(() => {
      getState = storeApi.getState
    }, [storeApi])
    return null
  }
  render(
    <WorkflowStoreProvider
      definitions={builtinBaseDefinitions}
      initialGraph={{
        nodes: [setterNode()],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        document: { id: "doc", name: "Doc", version: 1, metadata: {} },
      }}
    >
      <CaptureApi />
      {view}
    </WorkflowStoreProvider>
  )
  act(() => {
    getState!().openSearch()
    getState!().setSearchQuery("price")
  })
  return { next: () => act(() => getState!().searchNext()) }
}

const node = () => screen.getByTestId("node")

describe("search field marks", () => {
  afterEach(() => {
    cleanup()
  })

  it("marks the title for a label match", () => {
    renderView(<NodeView showVariable />)

    expect(screen.getByText("price setter").dataset.fieldSearchState).toBe(
      "current"
    )
    expect(node().dataset.hasCurrentField).toBe("true")
  })

  it("reports a current field when the view renders it", () => {
    const { next } = renderView(<NodeView showVariable />)

    next()

    expect(node().dataset.hasCurrentField).toBe("true")
    expect(screen.getByText("price setter").dataset.fieldSearchState).toBe(
      "match"
    )
  })

  it("keeps the strong mark on the node when the field is not rendered", () => {
    const { next } = renderView(<NodeView showVariable={false} />)

    next()

    expect(node().dataset.searchState).toBe("current")
    expect(node().dataset.hasCurrentField).toBe("false")
  })

  it("does not re-render the node view when the mark moves from title to field", () => {
    const { next } = renderView(<NodeView showVariable />)
    viewRenders = 0

    next()

    expect(
      screen
        .getByDisplayValue("price")
        .closest<HTMLElement>("[data-field-search-state]")?.dataset
        .fieldSearchState
    ).toBe("current")
    expect(viewRenders).toBe(0)
  })
})
