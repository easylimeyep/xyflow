"use client"

import { useEffect, useState } from "react"
import {
  WorkflowEditor,
  builtinDefinitions,
  createInitialGraphElk,
  graphScope,
  upstreamScope,
} from "@flow/flow"
import type { InitialGraphInput, WorkflowEditorProps } from "@flow/flow"

import { ExampleFrame } from "./example-frame"

export type VariableScopeMode = "upstream" | "global"

const SCOPES = {
  upstream: upstreamScope,
  global: graphScope,
} as const

/**
 * `Country` is wired into the evaluator, `City` sits on the canvas unconnected.
 * Upstream scope offers only `country`, so `{{ city }}` is flagged as Unknown;
 * global scope offers both.
 */
const graphInput: InitialGraphInput = {
  nodes: [
    {
      id: "demo-scope-input",
      kind: "inlineExpression",
      config: {
        template: ["address"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-scope-country",
      kind: "setVariable",
      label: "Country",
      config: {
        variableName: "country",
        variableType: "value",
        valueExpression: "Russia",
      },
    },
    {
      id: "demo-scope-city",
      kind: "setVariable",
      label: "City",
      config: {
        variableName: "city",
        variableType: "value",
        valueExpression: "Moscow",
      },
    },
    {
      id: "demo-scope-evaluator",
      kind: "evaluator",
      label: "Known place",
      config: {
        conditions: [
          {
            id: "demo-scope-condition",
            left: { type: "array", value: ["{{ country }}", "{{ city }}"] },
            operator: "is equal to",
            right: { type: "array", value: ["Russia", "Moscow"] },
          },
        ],
        logicalOperator: "and",
      },
    },
  ],
  edges: [
    {
      id: "demo-scope-edge-input-to-country",
      source: "demo-scope-input",
      target: "demo-scope-country",
    },
    {
      id: "demo-scope-edge-country-to-evaluator",
      source: "demo-scope-country",
      target: "demo-scope-evaluator",
    },
  ],
  document: {
    id: "workflow-demo-variable-scope",
    name: "Workflow Variable Scope Demo",
    metadata: { source: "docs-demo-variable-scope" },
  },
}

interface VariableScopeExampleProps {
  scope: VariableScopeMode
}

export function VariableScopeExample({ scope }: VariableScopeExampleProps) {
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
        // The scope is read when the editor's store is created, so switching
        // it remounts the editor.
        <WorkflowEditor
          key={scope}
          definitions={builtinDefinitions}
          initialGraph={graph}
          runtime={{ variables: { scope: SCOPES[scope] } }}
        />
      )}
    </ExampleFrame>
  )
}
