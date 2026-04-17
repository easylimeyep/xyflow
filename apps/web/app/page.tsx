"use client"

import type { ReactNode } from "react"

import { WorkflowEditor, type WorkflowEditorProps } from "@workspace/flow"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

const baseExample = `import { WorkflowEditor } from "@workspace/flow"

export function Example() {
  return <WorkflowEditor />
}`

const exampleInitialGraph: NonNullable<WorkflowEditorProps["initialGraph"]> = {
  nodes: [
    {
      id: "demo-inline-expression",
      type: "inlineExpression",
      position: { x: 0, y: 120 },
      width: 260,
      data: {
        kind: "inlineExpression",
        label: "Keyword",
        config: {
          template: ["lead"],
          isRoot: true,
          repeatable: false,
        },
      },
    },
    {
      id: "demo-extractor",
      type: "extractor",
      position: { x: 320, y: 120 },
      width: 260,
      data: {
        kind: "extractor",
        label: "Extractor",
        config: {
          tokenNumber: 1,
          extractExpression: "email",
          unlimited: false,
        },
      },
    },
    {
      id: "demo-set-variable",
      type: "setVariable",
      position: { x: 640, y: 120 },
      width: 260,
      data: {
        kind: "setVariable",
        label: "Setter",
        config: {
          variableName: "email",
          valueExpression: "{{ email }}",
        },
      },
    },
    {
      id: "demo-branch",
      type: "branch",
      position: { x: 960, y: 120 },
      width: 260,
      data: {
        kind: "branch",
        label: "Branch",
        config: {
          conditions: [
            {
              id: "demo-branch-condition",
              value: "{{ email }}",
              operator: "contains",
              targetValue: "@",
            },
          ],
          logicalOperator: "and",
        },
      },
    },
    {
      id: "demo-result",
      type: "result",
      position: { x: 1280, y: 120 },
      width: 260,
      data: {
        kind: "result",
        label: "Result",
        config: {
          category: "true",
        },
      },
    },
  ],
  edges: [
    {
      id: "demo-edge-inline-to-extractor",
      source: "demo-inline-expression",
      target: "demo-extractor",
      sourceHandle: null,
      targetHandle: null,
      data: {
        sourceKind: "inlineExpression",
        targetKind: "extractor",
      },
    },
    {
      id: "demo-edge-extractor-to-setter",
      source: "demo-extractor",
      target: "demo-set-variable",
      sourceHandle: null,
      targetHandle: null,
      data: {
        sourceKind: "extractor",
        targetKind: "setVariable",
      },
    },
    {
      id: "demo-edge-setter-to-branch",
      source: "demo-set-variable",
      target: "demo-branch",
      sourceHandle: null,
      targetHandle: null,
      data: {
        sourceKind: "setVariable",
        targetKind: "branch",
      },
    },
    {
      id: "demo-edge-branch-to-result",
      source: "demo-branch",
      target: "demo-result",
      sourceHandle: "branch-true",
      targetHandle: null,
      data: {
        sourceKind: "branch",
        targetKind: "result",
      },
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    version: 1,
    metadata: { source: "docs-demo" },
  },
}

const defaultGraphExample = `import { WorkflowEditor } from "@workspace/flow"

const initialGraph = {
  nodes: [
    { id: "demo-inline-expression", type: "inlineExpression", position: { x: 0, y: 120 }, data: { kind: "inlineExpression", label: "Keyword", config: { template: ["lead"], isRoot: true, repeatable: false } } },
    { id: "demo-extractor", type: "extractor", position: { x: 320, y: 120 }, data: { kind: "extractor", label: "Extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } } },
    { id: "demo-set-variable", type: "setVariable", position: { x: 640, y: 120 }, data: { kind: "setVariable", label: "Setter", config: { variableName: "email", valueExpression: "{{ email }}" } } },
    { id: "demo-branch", type: "branch", position: { x: 960, y: 120 }, data: { kind: "branch", label: "Branch", config: { conditions: [{ id: "demo-branch-condition", value: "{{ email }}", operator: "contains", targetValue: "@" }], logicalOperator: "and" } } },
    { id: "demo-result", type: "result", position: { x: 1280, y: 120 }, data: { kind: "result", label: "Result", config: { category: "true" } } },
  ],
  edges: [
    { id: "demo-edge-inline-to-extractor", source: "demo-inline-expression", target: "demo-extractor", sourceHandle: null, targetHandle: null, data: { sourceKind: "inlineExpression", targetKind: "extractor" } },
    { id: "demo-edge-extractor-to-setter", source: "demo-extractor", target: "demo-set-variable", sourceHandle: null, targetHandle: null, data: { sourceKind: "extractor", targetKind: "setVariable" } },
    { id: "demo-edge-setter-to-branch", source: "demo-set-variable", target: "demo-branch", sourceHandle: null, targetHandle: null, data: { sourceKind: "setVariable", targetKind: "branch" } },
    { id: "demo-edge-branch-to-result", source: "demo-branch", target: "demo-result", sourceHandle: "branch-true", targetHandle: null, data: { sourceKind: "branch", targetKind: "result" } },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    version: 1,
    metadata: { source: "docs-demo" },
  },
}

export function Example() {
  return <WorkflowEditor initialGraph={initialGraph} />
}`

export default function Page() {
  return (
    <div className="min-h-svh bg-gray-100 p-6">
      <Tabs
        defaultValue="base"
        className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[1600px]"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-950">
              Workflow editor examples
            </h1>
            <p className="text-sm text-gray-600">
              Переключайся между базовым использованием и сценарием с{" "}
              <code className="rounded bg-gray-200 px-1 py-0.5 text-xs text-gray-900">
                initialGraph
              </code>
              .
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="base">base</TabsTrigger>
            <TabsTrigger value="with-default-graph">
              with default graph
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="base"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <ExamplePreview
            title="Base"
            description="Текущий минимальный сценарий без дополнительных пропсов."
            code={baseExample}
          >
            <WorkflowEditor />
          </ExamplePreview>
        </TabsContent>

        <TabsContent
          value="with-default-graph"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <ExamplePreview
            title="With default graph"
            description="Пример `initialGraph` с одной нодой каждого вида, соединённых в цепочку, где последняя нода — `result`."
            code={defaultGraphExample}
          >
            <WorkflowEditor initialGraph={exampleInitialGraph} />
          </ExamplePreview>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ExamplePreview({
  title,
  description,
  code,
  children,
}: {
  title: string
  description: string
  code: string
  children: ReactNode
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
          <code>{code}</code>
        </pre>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {children}
      </div>
    </section>
  )
}
