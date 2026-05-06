"use client"

import {
  WorkflowEditor,
  createInitialGraph,
  type InitialGraphEdgeInput,
  type InitialGraphInput,
  type InitialGraphNodeInput,
} from "@workspace/flow"

import { ExamplePreview } from "./example-preview"

const laneNames = [
  "email",
  "phone",
  "country",
  "budget",
  "intent",
  "company",
  "role",
  "source",
  "timeline",
  "consent",
] as const

const laneNodes = laneNames.flatMap((name, index): InitialGraphNodeInput[] => [
  {
    id: `large-elk-extract-${name}`,
    kind: "extractor",
    label: `Extract ${name}`,
    config: {
      tokenNumber: index + 1,
      extractExpression: name,
      unlimited: false,
    },
  },
  {
    id: `large-elk-set-${name}`,
    kind: "setVariable",
    label: `Set ${name}`,
    config: {
      variableName: name,
      valueExpression: `{{ ${name} }}`,
    },
  },
])

const laneEdges = laneNames.flatMap((name): InitialGraphEdgeInput[] => [
  {
    id: `large-elk-edge-root-to-extract-${name}`,
    source: "large-elk-root-keyword",
    target: `large-elk-extract-${name}`,
  },
  {
    id: `large-elk-edge-extract-to-set-${name}`,
    source: `large-elk-extract-${name}`,
    target: `large-elk-set-${name}`,
  },
  {
    id: `large-elk-edge-set-${name}-to-aggregate`,
    source: `large-elk-set-${name}`,
    target: "large-elk-aggregate-keyword",
  },
])

const graphInput = {
  nodes: [
    {
      id: "large-elk-root-keyword",
      kind: "inlineExpression",
      label: "Keyword Root",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    ...laneNodes,
    {
      id: "large-elk-aggregate-keyword",
      kind: "inlineExpression",
      label: "Aggregate Signals",
      config: {
        template: [
          "{{ email }}",
          "{{ phone }}",
          "{{ country }}",
          "{{ intent }}",
        ],
        isRoot: false,
        repeatable: true,
      },
    },
    {
      id: "large-elk-aggregate-score",
      kind: "extractor",
      label: "Aggregate score",
      config: {
        tokenNumber: 11,
        extractExpression: "aggregateScore",
        unlimited: false,
      },
    },
    {
      id: "large-elk-set-score",
      kind: "setVariable",
      label: "Set score",
      config: {
        variableName: "score",
        valueExpression: "{{ aggregateScore }}",
      },
    },
    {
      id: "large-elk-policy-keyword",
      kind: "inlineExpression",
      label: "Policy Check",
      config: {
        template: ["{{ score }}", "{{ consent }}", "{{ country }}"],
        isRoot: false,
        repeatable: false,
      },
    },
    {
      id: "large-elk-final-evaluator",
      kind: "evaluator",
      label: "Qualified?",
      config: {
        conditions: [
          {
            id: "large-elk-final-condition",
            value: "{{ score }}",
            operator: "contains",
            targetValue: "qualified",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "large-elk-true-extract",
      kind: "extractor",
      label: "Extract approval reason",
      config: {
        tokenNumber: 12,
        extractExpression: "approvalReason",
        unlimited: false,
      },
    },
    {
      id: "large-elk-true-set",
      kind: "setVariable",
      label: "Set approval",
      config: {
        variableName: "approval",
        valueExpression: `
        {{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}
{{ approvalReason }}  

        `,
      },
    },
    {
      id: "large-elk-true-keyword",
      kind: "inlineExpression",
      label: "Approval Keyword",
      config: {
        template: ["{{ approval }}"],
        isRoot: false,
        repeatable: false,
      },
    },
    {
      id: "large-elk-true-evaluator",
      kind: "evaluator",
      label: "Auto approve?",
      config: {
        conditions: [
          {
            id: "large-elk-true-condition",
            value: "{{ approval }}",
            operator: "contains",
            targetValue: "auto",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "large-elk-true-score",
      kind: "extractor",
      label: "Extract approval score",
      config: {
        tokenNumber: 13,
        extractExpression: "approvalScore",
        unlimited: false,
      },
    },
    {
      id: "large-elk-true-summary",
      kind: "setVariable",
      label: "Set true summary",
      config: {
        variableName: "trueSummary",
        valueExpression: "{{ approvalScore }}",
      },
    },
    {
      id: "large-elk-result-true",
      kind: "result",
      label: "result true",
      config: {
        category: "true",
      },
    },
    {
      id: "large-elk-false-extract",
      kind: "extractor",
      label: "Extract review reason",
      config: {
        tokenNumber: 14,
        extractExpression: "reviewReason",
        unlimited: false,
      },
    },
    {
      id: "large-elk-false-set",
      kind: "setVariable",
      label: "Set review",
      config: {
        variableName: "review",
        valueExpression: "{{ reviewReason }}",
      },
    },
    {
      id: "large-elk-false-keyword",
      kind: "inlineExpression",
      label: "Review Keyword",
      config: {
        template: ["{{ review }}"],
        isRoot: false,
        repeatable: false,
      },
    },
    {
      id: "large-elk-false-evaluator",
      kind: "evaluator",
      label: "Needs escalation?",
      config: {
        conditions: [
          {
            id: "large-elk-false-condition",
            value: "{{ review }}",
            operator: "contains",
            targetValue: "escalate",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "large-elk-false-score",
      kind: "extractor",
      label: "Extract review score",
      config: {
        tokenNumber: 15,
        extractExpression: "reviewScore",
        unlimited: false,
      },
    },
    {
      id: "large-elk-false-summary",
      kind: "setVariable",
      label: "Set false summary",
      config: {
        variableName: "falseSummary",
        valueExpression: "{{ reviewScore }}",
      },
    },
    {
      id: "large-elk-result-false",
      kind: "result",
      label: "result false",
      config: {
        category: "false",
      },
    },
  ],
  edges: [
    ...laneEdges,
    {
      id: "large-elk-edge-aggregate-to-score",
      source: "large-elk-aggregate-keyword",
      target: "large-elk-aggregate-score",
    },
    {
      id: "large-elk-edge-score-to-set-score",
      source: "large-elk-aggregate-score",
      target: "large-elk-set-score",
    },
    {
      id: "large-elk-edge-set-score-to-policy",
      source: "large-elk-set-score",
      target: "large-elk-policy-keyword",
    },
    {
      id: "large-elk-edge-policy-to-final-evaluator",
      source: "large-elk-policy-keyword",
      target: "large-elk-final-evaluator",
    },
    {
      id: "large-elk-edge-final-true",
      source: "large-elk-final-evaluator",
      sourceHandle: "evaluator-true",
      target: "large-elk-true-extract",
    },
    {
      id: "large-elk-edge-final-false",
      source: "large-elk-final-evaluator",
      sourceHandle: "evaluator-false",
      target: "large-elk-false-extract",
    },
    {
      id: "large-elk-edge-true-extract-to-set",
      source: "large-elk-true-extract",
      target: "large-elk-true-set",
    },
    {
      id: "large-elk-edge-true-set-to-keyword",
      source: "large-elk-true-set",
      target: "large-elk-true-keyword",
    },
    {
      id: "large-elk-edge-true-keyword-to-evaluator",
      source: "large-elk-true-keyword",
      target: "large-elk-true-evaluator",
    },
    {
      id: "large-elk-edge-true-evaluator-to-score",
      source: "large-elk-true-evaluator",
      sourceHandle: "evaluator-true",
      target: "large-elk-true-score",
    },
    {
      id: "large-elk-edge-true-score-to-summary",
      source: "large-elk-true-score",
      target: "large-elk-true-summary",
    },
    {
      id: "large-elk-edge-true-summary-to-result",
      source: "large-elk-true-summary",
      target: "large-elk-result-true",
    },
    {
      id: "large-elk-edge-true-evaluator-to-result",
      source: "large-elk-true-evaluator",
      sourceHandle: "evaluator-false",
      target: "large-elk-result-true",
    },
    {
      id: "large-elk-edge-false-extract-to-set",
      source: "large-elk-false-extract",
      target: "large-elk-false-set",
    },
    {
      id: "large-elk-edge-false-set-to-keyword",
      source: "large-elk-false-set",
      target: "large-elk-false-keyword",
    },
    {
      id: "large-elk-edge-false-keyword-to-evaluator",
      source: "large-elk-false-keyword",
      target: "large-elk-false-evaluator",
    },
    {
      id: "large-elk-edge-false-evaluator-to-score",
      source: "large-elk-false-evaluator",
      sourceHandle: "evaluator-true",
      target: "large-elk-false-score",
    },
    {
      id: "large-elk-edge-false-score-to-summary",
      source: "large-elk-false-score",
      target: "large-elk-false-summary",
    },
    {
      id: "large-elk-edge-false-summary-to-result",
      source: "large-elk-false-summary",
      target: "large-elk-result-false",
    },
    {
      id: "large-elk-edge-false-evaluator-to-result",
      source: "large-elk-false-evaluator",
      sourceHandle: "evaluator-false",
      target: "large-elk-result-false",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.55 },
  document: {
    id: "workflow-demo-large-elk-graph",
    name: "Workflow Large ELK Demo",
    metadata: { source: "docs-demo-large-elk" },
  },
} satisfies InitialGraphInput

const initialGraph = createInitialGraph(graphInput)

const code = `import { WorkflowEditor, createInitialGraph } from "@workspace/flow"

const laneNames = ["email", "phone", "country", "budget", "intent", "company", "role", "source", "timeline", "consent"]

const initialGraph = createInitialGraph({
  nodes: [
    { id: "large-elk-root-keyword", kind: "inlineExpression", label: "Keyword Root", config: { template: ["lead"], isRoot: true, repeatable: false } },
    ...laneNames.flatMap((name, index) => [
      { id: \`large-elk-extract-\${name}\`, kind: "extractor", label: \`Extract \${name}\`, config: { tokenNumber: index + 1, extractExpression: name, unlimited: false } },
      { id: \`large-elk-set-\${name}\`, kind: "setVariable", label: \`Set \${name}\`, config: { variableName: name, valueExpression: \`{{ \${name} }}\` } },
    ]),
    { id: "large-elk-aggregate-keyword", kind: "inlineExpression", label: "Aggregate Signals", config: { template: ["{{ email }}", "{{ phone }}", "{{ country }}", "{{ intent }}"], isRoot: false, repeatable: true } },
    // Additional scoring, decision, true-path, and false-path nodes bring this graph to 40 nodes.
    { id: "large-elk-result-true", kind: "result", label: "result true", config: { category: "true" } },
    { id: "large-elk-result-false", kind: "result", label: "result false", config: { category: "false" } },
  ],
  edges: [
    ...laneNames.flatMap((name) => [
      { id: \`large-elk-edge-root-to-extract-\${name}\`, source: "large-elk-root-keyword", target: \`large-elk-extract-\${name}\` },
      { id: \`large-elk-edge-extract-to-set-\${name}\`, source: \`large-elk-extract-\${name}\`, target: \`large-elk-set-\${name}\` },
      { id: \`large-elk-edge-set-\${name}-to-aggregate\`, source: \`large-elk-set-\${name}\`, target: "large-elk-aggregate-keyword" },
    ]),
    // The Aggregate Signals keyword receives 10 incoming edges, then the workflow ends in result true/result false paths.
  ],
  viewport: { x: 40, y: 40, zoom: 0.55 },
})

export function Example() {
  return (
    <WorkflowEditor
      initialGraph={initialGraph}
      autoLayoutOnInit="after-measure"
    />
  )
}`

export function LargeElkGraphExample() {
  return (
    <ExamplePreview
      title="Large ELK graph"
      description="Большой `initialGraph`, где редактор сначала измеряет реальные DOM-размеры нод, а затем запускает ELK layout: 40 узлов, fan-in в один Keyword и финальные ветки result true/result false."
      code={code}
    >
      <WorkflowEditor
        initialGraph={initialGraph}
        autoLayoutOnInit="after-measure"
      />
    </ExamplePreview>
  )
}
