"use client"

import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraph,
} from "@flow/flow"
import type { WorkflowNodeOptionsCatalog } from "@flow/flow"

import { ExamplePreview } from "./example-preview"

/**
 * Select-backed config keys a host replaces without forking a node: the key is
 * the node kind, then the config key the select writes to. An empty array is a
 * valid answer — the node then shows a disabled select holding its stored
 * value, which is what a failed or empty server response should look like.
 */
const nodeOptions = {
  pathExtractor: {
    outputType: [
      { value: "raw", label: "raw payload" },
      { value: "digest", label: "digest" },
      { value: "rowset", label: "row set" },
    ],
  },
  jsonEvaluator: {
    matchType: [
      { value: "any", label: "Хотя бы одно" },
      { value: "all", label: "Все условия" },
      { value: "at-least-two", label: "Минимум два" },
    ],
  },
} satisfies WorkflowNodeOptionsCatalog

const initialGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "demo-custom-node-options-input",
      kind: "inlineExpression",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-custom-node-options-path",
      kind: "pathExtractor",
      label: "Address",
      config: {
        variableLabel: "city",
        path: "lead.address.city",
        outputType: "digest",
      },
    },
    {
      id: "demo-custom-node-options-evaluator",
      kind: "jsonEvaluator",
      label: "Lead rules",
      config: {
        conditions: [
          {
            id: "demo-custom-node-options-condition",
            left: { type: "value", value: "{{ city }}" },
            operator: "is equal to",
            right: { type: "value", value: "Moscow" },
          },
        ],
        logicalOperator: "and",
        matchType: "at-least-two",
      },
    },
    {
      id: "demo-custom-node-options-success",
      kind: "result",
      label: "Qualified",
      config: {
        category: "true",
      },
    },
  ],
  edges: [
    {
      id: "demo-custom-node-options-edge-input-to-path",
      source: "demo-custom-node-options-input",
      target: "demo-custom-node-options-path",
    },
    {
      id: "demo-custom-node-options-edge-path-to-evaluator",
      source: "demo-custom-node-options-path",
      target: "demo-custom-node-options-evaluator",
    },
    {
      id: "demo-custom-node-options-edge-evaluator-to-success",
      source: "demo-custom-node-options-evaluator",
      sourceHandle: "evaluator-true",
      target: "demo-custom-node-options-success",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.85 },
  document: {
    id: "workflow-demo-custom-node-options",
    name: "Workflow Custom Node Options Demo",
    metadata: { source: "docs-demo-custom-node-options" },
  },
})

const code = `import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

export function Example() {
  return (
    <WorkflowEditor
      definitions={builtinDefinitions}
      initialGraph={initialGraph}
      runtime={{
        // Keyed by node kind, then by the config key the select writes to.
        // A kind or key left out keeps the vocabulary the node ships with;
        // an empty array means "no choices" and disables that select.
        nodeOptions: {
          pathExtractor: {
            outputType: [
              { value: "raw", label: "raw payload" },
              { value: "digest", label: "digest" },
              { value: "rowset", label: "row set" },
            ],
          },
          jsonEvaluator: {
            matchType: [
              { value: "any", label: "Хотя бы одно" },
              { value: "all", label: "Все условия" },
              { value: "at-least-two", label: "Минимум два" },
            ],
          },
        },
      }}
    />
  )
}`

export function CustomNodeOptionsExample() {
  return (
    <ExamplePreview title="With custom node select options" code={code}>
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={initialGraph}
        runtime={{
          nodeOptions,
        }}
      />
    </ExamplePreview>
  )
}
