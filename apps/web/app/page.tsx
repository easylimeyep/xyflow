"use client"

import {
  WorkflowEditor,
  builtinDefinitions,
  createKeywordSampleGraph,
} from "@flow/flow"

const initialGraph = createKeywordSampleGraph(builtinDefinitions)

export default function Page() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={initialGraph}
      />
    </div>
  )
}
