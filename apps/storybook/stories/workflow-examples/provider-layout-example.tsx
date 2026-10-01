"use client"

import { PanelLeftIcon } from "lucide-react"

import {
  WorkflowEditor,
  WorkflowProvider,
  builtinDefinitions,
  createInitialGraph,
  useWorkflowLayout,
} from "@flow/flow"
import { Button } from "@flow/ui/components/button"

import { ExampleFrame } from "./example-frame"

const initialGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "provider-root",
      kind: "inlineExpression",
      label: "Incoming lead",
      config: { template: ["lead"], isRoot: true, repeatable: false },
    },
    {
      id: "provider-evaluator",
      kind: "evaluator",
      label: "Qualified?",
      config: {
        conditions: [
          {
            id: "provider-condition",
            left: { type: "value", value: "{{ lead.email }}" },
            operator: "contains",
            right: { type: "value", value: "@company.com" },
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "provider-result",
      kind: "result",
      label: "Route",
      config: { category: "true" },
    },
  ],
  edges: [
    {
      id: "provider-edge-root-evaluator",
      source: "provider-root",
      target: "provider-evaluator",
    },
    {
      id: "provider-edge-evaluator-result",
      source: "provider-evaluator",
      sourceHandle: "evaluator-true",
      target: "provider-result",
    },
  ],
  viewport: { x: 48, y: 72, zoom: 0.8 },
  document: {
    id: "workflow-demo-provider-layout",
    name: "Provider Layout Demo",
    metadata: { source: "docs-demo-provider-layout" },
  },
})

/**
 * A palette toggle the host owns, reading the same layout state the built-in
 * parts read via `useWorkflowLayout` — no store selectors, no prop drilling.
 * The label follows the user's choice (`isPaletteOpen`); a quick-add can still
 * show a closed palette for a moment (`isPaletteVisible`), and clicking then
 * pins it open.
 */
function PaletteToggle() {
  const { isPaletteOpen, isPaletteVisible, setIsPaletteOpen } =
    useWorkflowLayout()
  const isBorrowed = isPaletteVisible && !isPaletteOpen

  return (
    <div className="flex items-center gap-2">
      {isBorrowed ? (
        <span className="text-xs text-gray-500">Shown for quick add</span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsPaletteOpen(!isPaletteOpen)}
      >
        <PanelLeftIcon />
        {isPaletteOpen ? "Hide palette" : "Show palette"}
      </Button>
    </div>
  )
}

export function ProviderLayoutExample() {
  return (
    <ExampleFrame>
      <WorkflowProvider
        definitions={builtinDefinitions}
        initialGraph={initialGraph}
      >
        <div className="grid h-full grid-rows-[auto_1fr]">
          <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
            <WorkflowEditor.Toolbar placement="inline" />
            <PaletteToggle />
          </header>
          <div className="flex min-h-0">
            {/* Inline, the host decides what "closed" looks like. */}
            <WorkflowEditor.Palette
              placement="inline"
              className="data-[state=closed]:hidden"
            />
            <WorkflowEditor.Canvas />
            <WorkflowEditor.ConfigPanel side="right" />
          </div>
        </div>
      </WorkflowProvider>
    </ExampleFrame>
  )
}
