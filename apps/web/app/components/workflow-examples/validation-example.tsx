"use client"

import { useMemo, useState } from "react"

import {
  WorkflowEditor,
  createInitialGraph,
  type WorkflowValidationSnapshot,
} from "@workspace/flow"
import { Button } from "@workspace/ui/components/button"

import { ExamplePreview } from "./example-preview"

const initialGraph = createInitialGraph({
  nodes: [
    {
      id: "validation-keyword",
      kind: "inlineExpression",
      label: "Keyword",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
        caseSensitive: false,
      },
    },
    {
      id: "validation-evaluator",
      kind: "evaluator",
      label: "Evaluator",
      config: {
        conditions: [
          {
            id: "validation-condition",
            value: "{{ leadScore }}",
            operator: "is greater than",
            targetValue: "50",
          },
        ],
        logicalOperator: "and",
        caseSensitive: false,
      },
    },
    {
      id: "validation-result",
      kind: "result",
      label: "Result",
      config: { category: "true" },
    },
  ],
  edges: [
    {
      id: "validation-keyword-to-evaluator",
      source: "validation-keyword",
      target: "validation-evaluator",
    },
  ],
  viewport: { x: 30, y: 70, zoom: 0.85 },
  document: {
    id: "workflow-validation-demo",
    name: "Validation Demo",
    version: 7,
    metadata: { source: "validation-example" },
  },
})

function createValidationSnapshot(
  revisionIndex: number
): WorkflowValidationSnapshot {
  return {
    workflowId: "workflow-validation-demo",
    workflowVersion: 7,
    revision: `validation-${revisionIndex}`,
    global: [
      {
        code: "WORKFLOW_HAS_UNREACHABLE_RESULT",
        message: "Workflow has a Result node that is not reachable yet.",
        severity: "error",
      },
    ],
    nodes: [
      {
        nodeId: "validation-evaluator",
        code: "MISSING_FALSE_BRANCH",
        message: "Evaluator node must have a false branch.",
        severity: "error",
      },
      {
        nodeId: "validation-evaluator",
        code: "UNKNOWN_VARIABLE",
        message: "Variable `leadScore` is not available here.",
        severity: "warning",
        fieldPath: "config.conditions.0.value",
      },
    ],
  }
}

function useMockValidationQuery() {
  const [revisionIndex, setRevisionIndex] = useState(1)
  const [enabled, setEnabled] = useState(true)
  const data = useMemo(
    () => (enabled ? createValidationSnapshot(revisionIndex) : null),
    [enabled, revisionIndex]
  )

  return {
    data,
    revisionIndex,
    pushNextRevision: () => setRevisionIndex((current) => current + 1),
    clearValidation: () => setEnabled(false),
    restoreValidation: () => {
      setEnabled(true)
      setRevisionIndex((current) => current + 1)
    },
  }
}

const code = `import {
  WorkflowEditor,
  createInitialGraph,
  type WorkflowValidationSnapshot,
} from "@workspace/flow"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "validation-keyword", kind: "inlineExpression", config: { template: ["lead"], isRoot: true } },
    { id: "validation-evaluator", kind: "evaluator", config: { conditions: [{ id: "condition", value: "{{ leadScore }}", operator: "is greater than", targetValue: "50" }], logicalOperator: "and" } },
    { id: "validation-result", kind: "result", config: { category: "true" } },
  ],
  edges: [{ id: "keyword-to-evaluator", source: "validation-keyword", target: "validation-evaluator" }],
})

function useWorkflowValidationQuery(): { data: WorkflowValidationSnapshot | null } {
  return {
    data: {
      workflowId: "workflow-validation-demo",
      workflowVersion: 7,
      revision: "validation-1",
      global: [
        {
          code: "WORKFLOW_HAS_UNREACHABLE_RESULT",
          message: "Workflow has a Result node that is not reachable yet.",
          severity: "error",
        },
      ],
      nodes: [
        {
          nodeId: "validation-evaluator",
          code: "MISSING_FALSE_BRANCH",
          message: "Evaluator node must have a false branch.",
          severity: "error",
        },
        {
          nodeId: "validation-evaluator",
          code: "UNKNOWN_VARIABLE",
          message: "Variable \`leadScore\` is not available here.",
          severity: "warning",
          fieldPath: "config.conditions.0.value",
        },
      ],
    },
  }
}

export function Example() {
  const validationQuery = useWorkflowValidationQuery()

  return (
    <WorkflowEditor
      initialGraph={initialGraph}
      validation={validationQuery.data}
    />
  )
}`

export function ValidationExample() {
  const validationQuery = useMockValidationQuery()

  return (
    <ExamplePreview
      title="With validation"
      description="Пример внешней server/query-like validation: snapshot приходит снаружи, WorkflowEditor показывает global Alert и подсвечивает ноду. Измени Evaluator — локальная ошибка скроется до следующей revision."
      code={code}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={validationQuery.pushNextRevision}
        >
          Simulate server revision {validationQuery.revisionIndex + 1}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={validationQuery.clearValidation}
        >
          Clear validation
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={validationQuery.restoreValidation}
        >
          Restore validation
        </Button>
      </div>
      <WorkflowEditor
        initialGraph={initialGraph}
        validation={validationQuery.data}
      />
    </ExamplePreview>
  )
}
