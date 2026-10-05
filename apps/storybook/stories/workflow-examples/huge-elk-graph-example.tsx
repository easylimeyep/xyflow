"use client"

import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraph,
  type InitialGraphEdgeInput,
  type InitialGraphInput,
  type InitialGraphNodeInput,
} from "@flow/flow"

import { ExampleFrame } from "./example-frame"

const GROUP_COUNT = 8
const LANES_PER_GROUP = 15
const STAGES_PER_LANE = 2

const ROOT_ID = "huge-elk-root-keyword"
const FINAL_KEYWORD_ID = "huge-elk-final-keyword"
const FINAL_EVALUATOR_ID = "huge-elk-final-evaluator"
const RESULT_TRUE_ID = "huge-elk-result-true"
const RESULT_FALSE_ID = "huge-elk-result-false"

type GraphPart = {
  nodes: InitialGraphNodeInput[]
  edges: InitialGraphEdgeInput[]
}

const range = (count: number) => Array.from({ length: count }, (_, i) => i)

const edge = (source: string, target: string): InitialGraphEdgeInput => ({
  id: `huge-elk-edge-${source}-to-${target}`,
  source,
  target,
})

function buildStage(variable: string, tokenNumber: number): GraphPart {
  const extractId = `huge-elk-extract-${variable}`
  const setId = `huge-elk-set-${variable}`

  return {
    nodes: [
      {
        id: extractId,
        kind: "extractor",
        label: `Extract ${variable}`,
        config: { tokenNumber, extractExpression: variable, unlimited: false },
      },
      {
        id: setId,
        kind: "setVariable",
        label: `Set ${variable}`,
        config: { variableName: variable, valueExpression: `{{ ${variable} }}` },
      },
    ],
    edges: [edge(extractId, setId)],
  }
}

function buildLane(group: number, lane: number, targetId: string): GraphPart {
  const stages = range(STAGES_PER_LANE).map((stage) =>
    buildStage(`g${group}_l${lane}_s${stage}`, stage + 1)
  )
  const nodes = stages.flatMap((part) => part.nodes)
  const chainIds = [ROOT_ID, ...nodes.map((node) => node.id), targetId]

  return {
    nodes,
    edges: chainIds
      .slice(1)
      .map((target, index) => edge(chainIds[index]!, target)),
  }
}

function buildGroup(group: number): GraphPart {
  const keywordId = `huge-elk-group-${group}-keyword`
  const variable = `group${group}Score`
  const summary = buildStage(variable, group + 1)
  const lanes = range(LANES_PER_GROUP).map((lane) =>
    buildLane(group, lane, keywordId)
  )

  return {
    nodes: [
      ...lanes.flatMap((part) => part.nodes),
      {
        id: keywordId,
        kind: "inlineExpression",
        label: `Group ${group + 1} signals`,
        config: {
          template: [`{{ g${group}_l0_s${STAGES_PER_LANE - 1} }}`],
          isRoot: false,
          repeatable: true,
        },
      },
      ...summary.nodes,
    ],
    edges: [
      ...lanes.flatMap((part) => part.edges),
      edge(keywordId, summary.nodes[0]!.id),
      ...summary.edges,
      edge(summary.nodes[1]!.id, FINAL_KEYWORD_ID),
    ],
  }
}

const groups = range(GROUP_COUNT).map(buildGroup)

const graphInput = {
  nodes: [
    {
      id: ROOT_ID,
      kind: "inlineExpression",
      label: "Keyword Root",
      config: { template: ["lead"], isRoot: true, repeatable: false },
    },
    ...groups.flatMap((part) => part.nodes),
    {
      id: FINAL_KEYWORD_ID,
      kind: "inlineExpression",
      label: "Aggregate groups",
      config: {
        template: range(GROUP_COUNT).map((group) => `{{ group${group}Score }}`),
        isRoot: false,
        repeatable: true,
      },
    },
    {
      id: FINAL_EVALUATOR_ID,
      kind: "evaluator",
      label: "Qualified?",
      config: {
        conditions: [
          {
            id: "huge-elk-final-condition",
            left: { type: "value", value: "{{ group0Score }}" },
            operator: "contains",
            right: { type: "value", value: "qualified" },
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: RESULT_TRUE_ID,
      kind: "result",
      label: "result true",
      config: { category: "true" },
    },
    {
      id: RESULT_FALSE_ID,
      kind: "result",
      label: "result false",
      config: { category: "false" },
    },
  ],
  edges: [
    ...groups.flatMap((part) => part.edges),
    edge(FINAL_KEYWORD_ID, FINAL_EVALUATOR_ID),
    {
      id: "huge-elk-edge-final-true",
      source: FINAL_EVALUATOR_ID,
      sourceHandle: "evaluator-true",
      target: RESULT_TRUE_ID,
    },
    {
      id: "huge-elk-edge-final-false",
      source: FINAL_EVALUATOR_ID,
      sourceHandle: "evaluator-false",
      target: RESULT_FALSE_ID,
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.2 },
  document: {
    id: "workflow-demo-huge-elk-graph",
    name: "Workflow Huge ELK Demo",
    metadata: { source: "docs-demo-huge-elk" },
  },
} satisfies InitialGraphInput

const initialGraph = createInitialGraph(builtinDefinitions, graphInput)

export function HugeElkGraphExample() {
  return (
    <ExampleFrame>
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={initialGraph}
        autoLayoutOnInit="after-measure"
      />
    </ExampleFrame>
  )
}
