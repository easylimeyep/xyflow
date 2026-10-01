"use client"

import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraph,
} from "@flow/flow"

import { ExampleFrame } from "./example-frame"

/**
 * The JSON vocabulary the package ships with: `pathExtractor` resolves a value
 * out of the incoming payload, and `jsonEvaluator` branches on it. The
 * evaluator stores no left operand — the backend substitutes the previous
 * node's output — so each condition starts from an `upstream` marker and the
 * `matchType` select decides how many conditions must hold.
 */
const initialGraph = createInitialGraph(builtinDefinitions, {
  nodes: [
    {
      id: "demo-json-input",
      kind: "inlineExpression",
      config: { template: ["payload"], isRoot: true, repeatable: false },
    },
    {
      id: "demo-json-city",
      kind: "pathExtractor",
      label: "City",
      config: { path: "lead.address.city", outputType: "value" },
    },
    {
      id: "demo-json-tags",
      kind: "pathExtractor",
      label: "Tags",
      config: { path: "lead.tags", outputType: "arrayValue" },
    },
    {
      id: "demo-json-tags-setter",
      kind: "jsonSetter",
      label: "Save tags",
      // `appendInput` is only stored and exported; the backend decides what
      // appending the node's input means.
      config: {
        variableName: "leadTags",
        variableType: "array",
        valueExpression: "",
        clear: false,
        appendInput: true,
      },
    },
    {
      id: "demo-json-evaluator",
      kind: "jsonEvaluator",
      label: "Lead rules",
      config: {
        conditions: [
          {
            id: "demo-json-condition-city",
            // No stored left operand: the backend feeds the upstream output in.
            left: { type: "upstream" },
            operator: "is equal to",
            right: { type: "value", value: "Moscow" },
          },
          {
            id: "demo-json-condition-tags",
            left: { type: "upstream" },
            operator: "contains",
            right: { type: "array", value: ["priority", "enterprise"] },
          },
        ],
        logicalOperator: "and",
        caseSensitive: false,
        matchType: "all",
      },
    },
    {
      id: "demo-json-qualified",
      kind: "result",
      label: "Qualified",
      config: { category: "true" },
    },
    {
      id: "demo-json-rejected",
      kind: "result",
      label: "Rejected",
      config: { category: "false" },
    },
  ],
  edges: [
    {
      id: "demo-json-edge-input-to-city",
      source: "demo-json-input",
      target: "demo-json-city",
    },
    {
      id: "demo-json-edge-city-to-tags",
      source: "demo-json-city",
      target: "demo-json-tags",
    },
    {
      id: "demo-json-edge-tags-to-setter",
      source: "demo-json-tags",
      target: "demo-json-tags-setter",
    },
    {
      id: "demo-json-edge-setter-to-evaluator",
      source: "demo-json-tags-setter",
      target: "demo-json-evaluator",
    },
    {
      id: "demo-json-edge-evaluator-to-qualified",
      source: "demo-json-evaluator",
      sourceHandle: "evaluator-true",
      target: "demo-json-qualified",
    },
    {
      id: "demo-json-edge-evaluator-to-rejected",
      source: "demo-json-evaluator",
      sourceHandle: "evaluator-false",
      target: "demo-json-rejected",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-json-nodes",
    name: "Workflow JSON Nodes Demo",
    metadata: { source: "docs-demo-json-nodes" },
  },
})

export function JsonNodesExample() {
  return (
    <ExampleFrame>
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={initialGraph}
      />
    </ExampleFrame>
  )
}
