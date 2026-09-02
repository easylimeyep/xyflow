"use client"

import { SparklesIcon } from "lucide-react"

import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraph,
  defineNode,
} from "@flow/flow"
import type { NodeDefinition } from "@flow/flow"

import { ExamplePreview } from "./example-preview"

/** A consumer-defined kind that sits between the built-in nodes. */
const enrich = defineNode({
  kind: "enrich",
  title: "AI enrich",
  description: "Ask a model to enrich the incoming payload.",
  icon: SparklesIcon,
  category: "data",
  fields: [
    {
      key: "provider",
      label: "Provider",
      type: "select",
      options: [
        { label: "GigaChat", value: "gigachat" },
        { label: "OpenAI", value: "openai" },
      ],
    },
    {
      key: "instruction",
      label: "Instruction",
      type: "textarea",
      placeholder: "Classify the lead as hot / warm / cold",
    },
  ],
  buildDefaultConfig: () => ({ provider: "gigachat", instruction: "" }),
  subtitle: (config) =>
    config.instruction ? String(config.instruction) : "No instruction",
  outputPaths: ["result"],
  allowedTargets: ["evaluator", "setVariable", "result"],
})

const inlineExpressionBuiltin = builtinDefinitions.find(
  (definition) => definition.kind === "inlineExpression"
)

if (!inlineExpressionBuiltin) {
  throw new Error("inlineExpression built-in is missing from the package")
}

/**
 * Overriding a built-in: same `kind`, so it replaces the package's own
 * definition in place while keeping its bespoke renderer. Here we widen its
 * `allowedTargets` so the root keyword node can hand off to our custom `enrich`
 * kind — a built-in on its own doesn't know a consumer kind exists.
 */
const inlineExpressionWithHandoff = defineNode({
  ...inlineExpressionBuiltin,
  allowedTargets: [...inlineExpressionBuiltin.allowedTargets, "enrich"],
})

// Order matters: the override comes after the built-ins so the registry
// replaces the original; `enrich` is appended as a new palette entry.
const definitions: NodeDefinition[] = [
  ...builtinDefinitions,
  inlineExpressionWithHandoff,
  enrich,
]

const initialGraph = createInitialGraph(definitions, {
  nodes: [
    {
      id: "demo-mixed-input",
      kind: "inlineExpression",
      config: { template: ["lead"], isRoot: true, repeatable: false },
    },
    {
      id: "demo-mixed-enrich",
      kind: "enrich",
      label: "Score lead",
      config: {
        provider: "gigachat",
        instruction: "Classify {{ lead }} as hot, warm, or cold",
      },
    },
    {
      id: "demo-mixed-evaluator",
      kind: "evaluator",
      label: "Is hot?",
      config: {
        conditions: [
          {
            id: "demo-mixed-condition",
            left: { type: "value", value: "{{ result }}" },
            operator: "is equal to",
            right: { type: "value", value: "hot" },
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "demo-mixed-hot",
      kind: "result",
      label: "Route to sales",
      config: { category: "true" },
    },
    {
      id: "demo-mixed-cold",
      kind: "result",
      label: "Nurture",
      config: { category: "false" },
    },
  ],
  edges: [
    {
      id: "demo-mixed-edge-input-to-enrich",
      source: "demo-mixed-input",
      target: "demo-mixed-enrich",
    },
    {
      id: "demo-mixed-edge-enrich-to-evaluator",
      source: "demo-mixed-enrich",
      target: "demo-mixed-evaluator",
    },
    {
      id: "demo-mixed-edge-evaluator-to-hot",
      source: "demo-mixed-evaluator",
      sourceHandle: "evaluator-true",
      target: "demo-mixed-hot",
    },
    {
      id: "demo-mixed-edge-evaluator-to-cold",
      source: "demo-mixed-evaluator",
      sourceHandle: "evaluator-false",
      target: "demo-mixed-cold",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.75 },
  document: {
    id: "workflow-demo-mixed-nodes",
    name: "Workflow Mixed Nodes Demo",
    metadata: { source: "docs-demo-mixed-nodes" },
  },
})

const code = `import { WorkflowEditor, builtinDefinitions, createInitialGraph, defineNode } from "@flow/flow"
import { SparklesIcon } from "lucide-react"

// A new consumer kind that sits between the package's built-in nodes.
const enrich = defineNode({
  kind: "enrich",
  title: "AI enrich",
  description: "Ask a model to enrich the incoming payload.",
  icon: SparklesIcon,
  category: "data",
  fields: [
    { key: "provider", label: "Provider", type: "select", options: [
      { label: "GigaChat", value: "gigachat" },
      { label: "OpenAI", value: "openai" },
    ] },
    { key: "instruction", label: "Instruction", type: "textarea" },
  ],
  buildDefaultConfig: () => ({ provider: "gigachat", instruction: "" }),
  subtitle: (config) => (config.instruction ? String(config.instruction) : "No instruction"),
  outputPaths: ["result"],
  allowedTargets: ["evaluator", "setVariable", "result"],
})

// Override a built-in by re-declaring its kind: widen allowedTargets so the
// root keyword node can hand off to our custom kind. The registry replaces the
// original in place and keeps its bespoke renderer.
const inline = builtinDefinitions.find((d) => d.kind === "inlineExpression")!
const inlineWithHandoff = defineNode({
  ...inline,
  allowedTargets: [...inline.allowedTargets, "enrich"],
})

const definitions = [...builtinDefinitions, inlineWithHandoff, enrich]

const initialGraph = createInitialGraph(definitions, {
  nodes: [
    { id: "input", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "enrich", kind: "enrich", label: "Score lead", config: { provider: "gigachat", instruction: "Classify {{ lead }} as hot, warm, or cold" } },
    { id: "eval", kind: "evaluator", label: "Is hot?", config: { conditions: [
      { id: "c1", left: { type: "value", value: "{{ result }}" }, operator: "is equal to", right: { type: "value", value: "hot" } },
    ], logicalOperator: "and" } },
    { id: "hot", kind: "result", label: "Route to sales", config: { category: "true" } },
    { id: "cold", kind: "result", label: "Nurture", config: { category: "false" } },
  ],
  edges: [
    { id: "e1", source: "input", target: "enrich" },
    { id: "e2", source: "enrich", target: "eval" },
    { id: "e3", source: "eval", sourceHandle: "evaluator-true", target: "hot" },
    { id: "e4", source: "eval", sourceHandle: "evaluator-false", target: "cold" },
  ],
})

export function Example() {
  return <WorkflowEditor definitions={definitions} initialGraph={initialGraph} />
}`

export function MixedNodesExample() {
  return (
    <ExamplePreview
      title="Built-ins + custom nodes"
      code={code}
    >
      <WorkflowEditor definitions={definitions} initialGraph={initialGraph} />
    </ExamplePreview>
  )
}
