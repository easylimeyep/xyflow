"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronDownIcon, Code2Icon } from "lucide-react"

import {
  WorkflowEditor,
  createInitialGraph,
  createInitialGraphElk,
  type WorkflowEditorProps,
} from "@workspace/flow"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

const baseExample = `import { WorkflowEditor } from "@workspace/flow"

export function Example() {
  return <WorkflowEditor />
}`

const exampleElkGraphInput = {
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
      id: "demo-elk-branch",
      kind: "branch" as const,
      config: {
        conditions: [
          {
            id: "demo-elk-branch-condition",
            value: "{{ email }}",
            operator: "contains" as const,
            targetValue: "@",
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
      id: "demo-elk-edge-extractor-to-branch",
      source: "demo-elk-extractor",
      target: "demo-elk-branch",
    },
    {
      id: "demo-elk-edge-branch-to-true-result",
      source: "demo-elk-branch",
      sourceHandle: "branch-true",
      target: "demo-elk-true-result",
    },
    {
      id: "demo-elk-edge-branch-to-false-result",
      source: "demo-elk-branch",
      sourceHandle: "branch-false",
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

const exampleInitialGraph = createInitialGraph({
  nodes: [
    {
      id: "demo-inline-expression",
      kind: "inlineExpression",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-extractor",
      kind: "extractor",
      config: {
        tokenNumber: 1,
        extractExpression: "email",
        unlimited: false,
      },
    },
    {
      id: "demo-set-variable",
      kind: "setVariable",
      label: "Setter",
      config: {
        variableName: "email",
        valueExpression: "{{ email }}",
      },
    },
    {
      id: "demo-branch",
      kind: "branch",
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
    {
      id: "demo-result",
      kind: "result",
      config: {
        category: "true",
      },
    },
  ],
  edges: [
    {
      id: "demo-edge-inline-to-extractor",
      source: "demo-inline-expression",
      target: "demo-extractor",
    },
    {
      id: "demo-edge-extractor-to-setter",
      source: "demo-extractor",
      target: "demo-set-variable",
    },
    {
      id: "demo-edge-setter-to-branch",
      source: "demo-set-variable",
      target: "demo-branch",
    },
    {
      id: "demo-edge-branch-to-result",
      source: "demo-branch",
      sourceHandle: "branch-true",
      target: "demo-result",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    metadata: { source: "docs-demo" },
  },
})

const defaultGraphExample = `import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "demo-inline-expression", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "demo-extractor", kind: "extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } },
    { id: "demo-set-variable", kind: "setVariable", label: "Setter", config: { variableName: "email", valueExpression: "{{ email }}" } },
    { id: "demo-branch", kind: "branch", config: { conditions: [{ id: "demo-branch-condition", value: "{{ email }}", operator: "contains", targetValue: "@" }], logicalOperator: "and" } },
    { id: "demo-result", kind: "result", config: { category: "true" } },
  ],
  edges: [
    { id: "demo-edge-inline-to-extractor", source: "demo-inline-expression", target: "demo-extractor" },
    { id: "demo-edge-extractor-to-setter", source: "demo-extractor", target: "demo-set-variable" },
    { id: "demo-edge-setter-to-branch", source: "demo-set-variable", target: "demo-branch" },
    { id: "demo-edge-branch-to-result", source: "demo-branch", sourceHandle: "branch-true", target: "demo-result" },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-all-node-kinds",
    name: "Workflow Demo",
    metadata: { source: "docs-demo" },
  },
})

export function Example() {
  return <WorkflowEditor initialGraph={initialGraph} />
}`

const elkGraphExample = `import { WorkflowEditor, createInitialGraphElk } from "@workspace/flow"

const initialGraph = await createInitialGraphElk({
  nodes: [
    { id: "demo-elk-inline-expression", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "demo-elk-extractor", kind: "extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } },
    { id: "demo-elk-branch", kind: "branch", config: { conditions: [{ id: "demo-elk-branch-condition", value: "{{ email }}", operator: "contains", targetValue: "@" }], logicalOperator: "and" } },
    { id: "demo-elk-true-result", kind: "result", label: "Valid Email", config: { category: "true" } },
    { id: "demo-elk-false-result", kind: "result", label: "Needs Review", config: { category: "false" } },
  ],
  edges: [
    { id: "demo-elk-edge-inline-to-extractor", source: "demo-elk-inline-expression", target: "demo-elk-extractor" },
    { id: "demo-elk-edge-extractor-to-branch", source: "demo-elk-extractor", target: "demo-elk-branch" },
    { id: "demo-elk-edge-branch-to-true-result", source: "demo-elk-branch", sourceHandle: "branch-true", target: "demo-elk-true-result" },
    { id: "demo-elk-edge-branch-to-false-result", source: "demo-elk-branch", sourceHandle: "branch-false", target: "demo-elk-false-result" },
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

const exampleCustomOperatorsGraph = createInitialGraph({
  nodes: [
    {
      id: "demo-custom-operators-input",
      kind: "inlineExpression",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-custom-operators-branch",
      kind: "branch",
      label: "Email rules",
      config: {
        conditions: [
          {
            id: "demo-custom-operators-condition-contains",
            value: "{{ lead.email }}",
            operator: "includes",
            targetValue: "@company.com",
          },
          {
            id: "demo-custom-operators-condition-presence",
            value: "{{ lead.email }}",
            operator: "has-value",
            targetValue: "",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "demo-custom-operators-success",
      kind: "result",
      label: "Qualified",
      config: {
        category: "true",
      },
    },
    {
      id: "demo-custom-operators-failure",
      kind: "result",
      label: "Needs cleanup",
      config: {
        category: "false",
      },
    },
  ],
  edges: [
    {
      id: "demo-custom-operators-edge-input-to-branch",
      source: "demo-custom-operators-input",
      target: "demo-custom-operators-branch",
    },
    {
      id: "demo-custom-operators-edge-branch-to-success",
      source: "demo-custom-operators-branch",
      sourceHandle: "branch-true",
      target: "demo-custom-operators-success",
    },
    {
      id: "demo-custom-operators-edge-branch-to-failure",
      source: "demo-custom-operators-branch",
      sourceHandle: "branch-false",
      target: "demo-custom-operators-failure",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-operators",
    name: "Workflow Custom Operators Demo",
    metadata: { source: "docs-demo-custom-operators" },
  },
})

const customOperatorsExample = `import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "demo-custom-operators-input", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    {
      id: "demo-custom-operators-branch",
      kind: "branch",
      label: "Email rules",
      config: {
        conditions: [
          { id: "demo-custom-operators-condition-contains", value: "{{ lead.email }}", operator: "includes", targetValue: "@company.com" },
          { id: "demo-custom-operators-condition-presence", value: "{{ lead.email }}", operator: "has-value", targetValue: "" },
        ],
        logicalOperator: "and",
      },
    },
    { id: "demo-custom-operators-success", kind: "result", label: "Qualified", config: { category: "true" } },
    { id: "demo-custom-operators-failure", kind: "result", label: "Needs cleanup", config: { category: "false" } },
  ],
  edges: [
    { id: "demo-custom-operators-edge-input-to-branch", source: "demo-custom-operators-input", target: "demo-custom-operators-branch" },
    { id: "demo-custom-operators-edge-branch-to-success", source: "demo-custom-operators-branch", sourceHandle: "branch-true", target: "demo-custom-operators-success" },
    { id: "demo-custom-operators-edge-branch-to-failure", source: "demo-custom-operators-branch", sourceHandle: "branch-false", target: "demo-custom-operators-failure" },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-operators",
    name: "Workflow Custom Operators Demo",
    metadata: { source: "docs-demo-custom-operators" },
  },
})

export function Example() {
  return (
    <WorkflowEditor
      initialGraph={initialGraph}
      runtime={{
        branch: {
          operators: [
            { id: "includes", value: "includes domain", requiresTarget: true },
            { id: "excludes", value: "excludes domain", requiresTarget: true },
            { id: "has-value", value: "has value", requiresTarget: false },
            { id: "is-missing", value: "is missing", requiresTarget: false },
          ],
        },
      }}
    />
  )
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
              , ELK layout и кастомными boolean-операторами.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="base">base</TabsTrigger>
            <TabsTrigger value="with-default-graph">
              with default graph
            </TabsTrigger>
            <TabsTrigger value="with-elk-graph">with elk graph</TabsTrigger>
            <TabsTrigger value="with-custom-operators">
              with custom operators
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
            description="Пример `initialGraph`, собранного через `createInitialGraph`, где размер нод, edge metadata и позиции подставляются автоматически. Для более сложных схем можно использовать async `createInitialGraphElk`."
            code={defaultGraphExample}
          >
            <WorkflowEditor initialGraph={exampleInitialGraph} />
          </ExamplePreview>
        </TabsContent>

        <TabsContent
          value="with-elk-graph"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <ExamplePreview
            title="With ELK graph"
            description="Пример `initialGraph`, собранного через async `createInitialGraphElk`, когда стартовую схему удобнее сразу разложить ELK-алгоритмом."
            code={elkGraphExample}
          >
            <ElkGraphExample />
          </ExamplePreview>
        </TabsContent>

        <TabsContent
          value="with-custom-operators"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <ExamplePreview
            title="With custom boolean operators"
            description="Пример кастомизации boolean branch-блока через `runtime.branch.operators`, где снаружи прокидываются id, label и признак `requiresTarget`."
            code={customOperatorsExample}
          >
            <WorkflowEditor
              initialGraph={exampleCustomOperatorsGraph}
              runtime={{
                branch: {
                  operators: [
                    {
                      id: "includes",
                      value: "includes domain",
                      requiresTarget: true,
                    },
                    {
                      id: "excludes",
                      value: "excludes domain",
                      requiresTarget: true,
                    },
                    {
                      id: "has-value",
                      value: "has value",
                      requiresTarget: false,
                    },
                    {
                      id: "is-missing",
                      value: "is missing",
                      requiresTarget: false,
                    },
                  ],
                },
              }}
            />
          </ExamplePreview>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ElkGraphExample() {
  const [graph, setGraph] =
    useState<WorkflowEditorProps["initialGraph"] | null>(null)

  useEffect(() => {
    let active = true

    void createInitialGraphElk(exampleElkGraphInput).then((nextGraph) => {
      if (active) {
        setGraph(nextGraph)
      }
    })

    return () => {
      active = false
    }
  }, [])

  if (graph == null) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 text-sm text-gray-500">
        Computing ELK layout...
      </div>
    )
  }

  return <WorkflowEditor initialGraph={graph} />
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
        <Collapsible className="group flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={`Toggle ${title} code example`}
                    >
                      <Code2Icon />
                      <ChevronDownIcon className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Show code example</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <CollapsibleContent>
            <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
              <code>{code}</code>
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex min-h-0 min-h-screen flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {children}
      </div>
    </section>
  )
}
