"use client"

import { useEffect, useState } from "react"

import {
  WorkflowEditor,
  createInitialGraphElk,
  type WorkflowEditorProps,
} from "@workspace/flow"

import { ExamplePreview } from "./example-preview"

const graphInput = {
  nodes: [
    {
      id: "demo-elk-inline-expression",
      kind: "inlineExpression" as const,
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-elk-extractor",
      kind: "extractor" as const,
      config: {
        tokenNumber: 1,
        extractExpression: "email",
        unlimited: false,
      },
    },
    {
      id: "demo-elk-evaluator",
      kind: "evaluator" as const,
      config: {
        conditions: [
          {
            id: "demo-elk-evaluator-condition",
            left: { type: "string" as const, value: "{{ email }}" },
            operator: "contains" as const,
            right: { type: "string" as const, value: "@" },
          },
        ],
        logicalOperator: "and" as const,
      },
    },
    {
      id: "demo-elk-true-result",
      kind: "result" as const,
      label: "Valid Email",
      config: {
        category: "true" as const,
      },
    },
    {
      id: "demo-elk-false-result",
      kind: "result" as const,
      label: "Needs Review",
      config: {
        category: "false" as const,
      },
    },
  ],
  edges: [
    {
      id: "demo-elk-edge-inline-to-extractor",
      source: "demo-elk-inline-expression",
      target: "demo-elk-extractor",
    },
    {
      id: "demo-elk-edge-extractor-to-evaluator",
      source: "demo-elk-extractor",
      target: "demo-elk-evaluator",
    },
    {
      id: "demo-elk-edge-evaluator-to-true-result",
      source: "demo-elk-evaluator",
      sourceHandle: "evaluator-true",
      target: "demo-elk-true-result",
    },
    {
      id: "demo-elk-edge-evaluator-to-false-result",
      source: "demo-elk-evaluator",
      sourceHandle: "evaluator-false",
      target: "demo-elk-false-result",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-elk-graph",
    name: "Workflow ELK Demo",
    metadata: { source: "docs-demo-elk" },
  },
}

const code = `import { WorkflowEditor, createInitialGraphElk } from "@workspace/flow"

const initialGraph = await createInitialGraphElk({
  nodes: [
    { id: "demo-elk-inline-expression", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "demo-elk-extractor", kind: "extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } },
    { id: "demo-elk-evaluator", kind: "evaluator", config: { conditions: [{ id: "demo-elk-evaluator-condition", left: { type: "string", value: "{{ email }}" }, operator: "contains", right: { type: "string", value: "@" } }], logicalOperator: "and" } },
    { id: "demo-elk-true-result", kind: "result", label: "Valid Email", config: { category: "true" } },
    { id: "demo-elk-false-result", kind: "result", label: "Needs Review", config: { category: "false" } },
  ],
  edges: [
    { id: "demo-elk-edge-inline-to-extractor", source: "demo-elk-inline-expression", target: "demo-elk-extractor" },
    { id: "demo-elk-edge-extractor-to-evaluator", source: "demo-elk-extractor", target: "demo-elk-evaluator" },
    { id: "demo-elk-edge-evaluator-to-true-result", source: "demo-elk-evaluator", sourceHandle: "evaluator-true", target: "demo-elk-true-result" },
    { id: "demo-elk-edge-evaluator-to-false-result", source: "demo-elk-evaluator", sourceHandle: "evaluator-false", target: "demo-elk-false-result" },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-elk-graph",
    name: "Workflow ELK Demo",
    metadata: { source: "docs-demo-elk" },
  },
})

export function Example() {
  return <WorkflowEditor initialGraph={initialGraph} />
}`

export function ElkGraphExample() {
  const [graph, setGraph] = useState<
    WorkflowEditorProps["initialGraph"] | null
  >(null)

  useEffect(() => {
    let active = true

    void createInitialGraphElk(graphInput).then((nextGraph) => {
      if (active) {
        setGraph(nextGraph)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <ExamplePreview
      title="With ELK graph"
      description="Пример `initialGraph`, собранного через async `createInitialGraphElk`, когда стартовую схему удобнее сразу разложить ELK-алгоритмом."
      code={code}
    >
      {graph == null ? (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 text-sm text-gray-500">
          Computing ELK layout...
        </div>
      ) : (
        <WorkflowEditor initialGraph={graph} />
      )}
    </ExamplePreview>
  )
}
