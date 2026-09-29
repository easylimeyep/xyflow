"use client"

import { useEffect, useState } from "react"
import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraphElk,
  type InitialGraphEdgeInput,
  type InitialGraphInput,
  type InitialGraphNodeInput,
  type WorkflowEditorProps,
  type WorkflowSearchPosition,
} from "@flow/flow"

import { ExamplePreview } from "./example-preview"

const regions = ["north", "south", "east", "west", "central", "coast"] as const

// Every region reads the shared `price`, and each defines its own quote, so a
// search for "price" hits one definition, a label per region and a reference
// in every expression that uses it.
const regionNodes = regions.flatMap((region): InitialGraphNodeInput[] => [
  {
    id: `search-quote-${region}`,
    kind: "setVariable",
    label: `Quote ${region}`,
    config: {
      variableName: `${region}Quote`,
      valueExpression: `{{ price * ${region}Rate }}`,
    },
  },
  {
    id: `search-message-${region}`,
    kind: "inlineExpression",
    label: `Message ${region}`,
    config: {
      template: ["{{ price }}", `{{ ${region}Quote }}`],
      isRoot: false,
      repeatable: false,
    },
  },
  {
    id: `search-check-${region}`,
    kind: "evaluator",
    label: `Check ${region} price`,
    config: {
      conditions: [
        {
          id: `search-condition-${region}`,
          left: { type: "value", value: `{{ ${region}Quote }}` },
          operator: "is equal to",
          right: { type: "value", value: "{{ price }}" },
        },
      ],
      logicalOperator: "and",
    },
  },
])

const regionEdges = regions.flatMap((region): InitialGraphEdgeInput[] => [
  {
    id: `search-edge-price-to-${region}`,
    source: "search-set-price",
    target: `search-quote-${region}`,
  },
  {
    id: `search-edge-${region}-quote-to-message`,
    source: `search-quote-${region}`,
    target: `search-message-${region}`,
  },
  {
    id: `search-edge-${region}-message-to-check`,
    source: `search-message-${region}`,
    target: `search-check-${region}`,
  },
])

const graphInput: InitialGraphInput = {
  nodes: [
    {
      id: "search-root",
      kind: "inlineExpression",
      label: "Order received",
      config: { template: ["order"], isRoot: true, repeatable: false },
    },
    {
      id: "search-extract-amount",
      kind: "extractor",
      label: "Extract amount",
      config: { tokenNumber: 1, extractExpression: "amount", unlimited: false },
    },
    {
      id: "search-set-price",
      kind: "setVariable",
      label: "Set price",
      config: { variableName: "price", valueExpression: "{{ amount }}" },
    },
    ...regionNodes,
  ],
  edges: [
    {
      id: "search-edge-root-to-amount",
      source: "search-root",
      target: "search-extract-amount",
    },
    {
      id: "search-edge-amount-to-price",
      source: "search-extract-amount",
      target: "search-set-price",
    },
    ...regionEdges,
  ],
  document: {
    id: "workflow-demo-canvas-search",
    name: "Workflow Canvas Search Demo",
    metadata: { source: "docs-demo-canvas-search" },
  },
}

const code = `import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

// Search is part of the default composition: focus the editor and press
// Cmd+F (Ctrl+F elsewhere). Enter / Shift+Enter step through every
// occurrence; Escape closes. Click the "N / M" counter to list every match,
// grouped by node, with case, whole-word and source filters.
// In a custom layout, place it inside the canvas so it floats over it:
export function Example() {
  return (
    <WorkflowEditor definitions={builtinDefinitions} initialGraph={graph}>
      <WorkflowEditor.Body>
        <WorkflowEditor.Canvas>
          {/* position: top-left | top-center | top-right (default) |
              center-left | center-right | bottom-left | bottom-center |
              bottom-right */}
          <WorkflowEditor.Search position="top-right" />
        </WorkflowEditor.Canvas>
      </WorkflowEditor.Body>
    </WorkflowEditor>
  )
}`

/**
 * Opens the search with a query already typed, so the story shows marks, and
 * optionally expands the results panel under the bar.
 */
function SearchPreset({
  query,
  showResults,
}: {
  query: string
  showResults: boolean
}) {
  const { openSearch, setSearchQuery, isResultsOpen, toggleSearchResults } =
    WorkflowEditor.use.shallowStore((state) => ({
      openSearch: state.openSearch,
      setSearchQuery: state.setSearchQuery,
      isResultsOpen: state.search.isResultsOpen,
      toggleSearchResults: state.toggleSearchResults,
    }))

  useEffect(() => {
    if (!query) {
      return
    }
    openSearch()
    setSearchQuery(query)
  }, [openSearch, query, setSearchQuery])

  useEffect(() => {
    if (showResults && !isResultsOpen) {
      toggleSearchResults()
    }
    // Only on mount: afterwards the counter owns the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export interface CanvasSearchExampleProps {
  /** Typed into the search once the editor mounts; empty leaves it closed. */
  initialQuery: string
  /** Expands the results panel under the bar on mount. */
  showResults?: boolean
  /** Where the floating bar sits over the canvas. */
  position?: WorkflowSearchPosition
}

export function CanvasSearchExample({
  initialQuery,
  showResults = false,
  position = "top-right",
}: CanvasSearchExampleProps) {
  const [graph, setGraph] = useState<
    WorkflowEditorProps["initialGraph"] | null
  >(null)

  useEffect(() => {
    let active = true

    void createInitialGraphElk(builtinDefinitions, graphInput).then(
      (nextGraph) => {
        if (active) {
          setGraph(nextGraph)
        }
      }
    )

    return () => {
      active = false
    }
  }, [])

  return (
    <ExamplePreview
      title="Canvas search: press Cmd+F / Ctrl+F inside the editor"
      code={code}
    >
      {graph == null ? (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 text-sm text-gray-500">
          Computing ELK layout...
        </div>
      ) : (
        <WorkflowEditor
          key={`${initialQuery}|${showResults}|${position}`}
          definitions={builtinDefinitions}
          initialGraph={graph}
        >
          <SearchPreset query={initialQuery} showResults={showResults} />
          <WorkflowEditor.Toolbar />
          <WorkflowEditor.Body>
            <WorkflowEditor.ValidationAlert />
            <WorkflowEditor.ConfigPanel />
            <WorkflowEditor.Palette />
            <WorkflowEditor.Canvas>
              <WorkflowEditor.Search position={position} />
            </WorkflowEditor.Canvas>
          </WorkflowEditor.Body>
        </WorkflowEditor>
      )}
    </ExamplePreview>
  )
}
