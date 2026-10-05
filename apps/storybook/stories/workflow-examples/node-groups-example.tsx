"use client"

import { useEffect, useState } from "react"
import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraphElk,
  type InitialGraphInput,
  type WorkflowCanvasMode,
  type WorkflowEditorProps,
  type WorkflowRuntimeOverlay,
} from "@flow/flow"

import { ExampleFrame } from "./example-frame"

// An order flow in three named parts: parsing the order (expanded), pricing
// (collapsed into a card, its edges drawn to the card), and the final check.
const graphInput: InitialGraphInput = {
  nodes: [
    {
      id: "groups-order",
      kind: "inlineExpression",
      label: "Order received",
      config: { template: ["order"], isRoot: true, repeatable: false },
    },
    {
      id: "groups-extract-amount",
      kind: "extractor",
      label: "Extract amount",
      config: { tokenNumber: 1, extractExpression: "amount", unlimited: false },
    },
    {
      id: "groups-extract-region",
      kind: "pathExtractor",
      label: "Extract region",
      config: { path: "$.region", outputType: "string" },
    },
    {
      id: "groups-set-price",
      kind: "setVariable",
      label: "Set price",
      config: { variableName: "price", valueExpression: "{{ amount }}" },
    },
    {
      id: "groups-set-tax",
      kind: "setVariable",
      label: "Set tax",
      config: { variableName: "tax", valueExpression: "{{ price * 0.2 }}" },
    },
    {
      id: "groups-set-total",
      kind: "setVariable",
      label: "Set total",
      config: { variableName: "total", valueExpression: "{{ price + tax }}" },
    },
    {
      id: "groups-check-total",
      kind: "evaluator",
      label: "Total within limit",
      config: {
        conditions: [
          {
            id: "groups-check-total-condition",
            left: { type: "value", value: "{{ total }}" },
            operator: "is less than",
            right: { type: "value", value: "1000" },
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "groups-approved",
      kind: "result",
      label: "Approved",
      config: { category: "true" },
    },
    {
      id: "groups-review",
      kind: "result",
      label: "Needs review",
      config: { category: "false" },
    },
  ],
  edges: [
    { source: "groups-order", target: "groups-extract-amount" },
    { source: "groups-extract-amount", target: "groups-extract-region" },
    { source: "groups-extract-region", target: "groups-set-price" },
    { source: "groups-set-price", target: "groups-set-tax" },
    { source: "groups-set-tax", target: "groups-set-total" },
    { source: "groups-set-total", target: "groups-check-total" },
    {
      source: "groups-check-total",
      sourceHandle: "evaluator-true",
      target: "groups-approved",
    },
    {
      source: "groups-check-total",
      sourceHandle: "evaluator-false",
      target: "groups-review",
    },
  ],
  groups: [
    {
      id: "groups-parse",
      label: "Parse order",
      color: "green",
      nodeIds: ["groups-extract-amount", "groups-extract-region"],
    },
    {
      id: "groups-pricing",
      label: "Pricing",
      color: "orange",
      nodeIds: ["groups-set-price", "groups-set-tax", "groups-set-total"],
      collapsed: true,
    },
    {
      id: "groups-decision",
      label: "Decision",
      color: "purple",
      nodeIds: ["groups-check-total", "groups-approved", "groups-review"],
    },
  ],
  viewport: { x: 40, y: 300, zoom: 0.45 },
  document: {
    id: "workflow-demo-node-groups",
    name: "Workflow Node Groups Demo",
    metadata: { source: "docs-demo-node-groups" },
  },
}

// In observe mode the collapsed "Pricing" card sums its hidden members up:
// one of them is still running.
const overlay: WorkflowRuntimeOverlay = {
  nodes: {
    "groups-order": { status: "done" },
    "groups-extract-amount": { status: "done" },
    "groups-extract-region": { status: "done" },
    "groups-set-price": { status: "done" },
    "groups-set-tax": { status: "running" },
  },
  activeEdgeIds: [],
  traversedEdgeIds: [],
}

export interface NodeGroupsExampleProps {
  /**
   * `edit` groups, renames, resizes and collapses for real; `observe` keeps
   * the workflow read-only and only lets the viewer expand groups locally.
   */
  mode?: WorkflowCanvasMode
}

export function NodeGroupsExample({ mode = "edit" }: NodeGroupsExampleProps) {
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
    <ExampleFrame>
      {graph == null ? (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 text-sm text-gray-500">
          Computing ELK layout...
        </div>
      ) : (
        <WorkflowEditor
          key={mode}
          definitions={builtinDefinitions}
          initialGraph={graph}
          mode={mode}
          overlay={mode === "observe" ? overlay : undefined}
        >
          {/* The canvas alone, full width, so all three groups are in view. */}
          <WorkflowEditor.Body>
            <WorkflowEditor.Canvas>
              <WorkflowEditor.Toolbar />
            </WorkflowEditor.Canvas>
          </WorkflowEditor.Body>
        </WorkflowEditor>
      )}
    </ExampleFrame>
  )
}
