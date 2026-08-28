"use client"

import {
  WorkflowEditor,
  builtinDefinitions,
  createKeywordSampleGraph,
  registerNodeDefinitions,
} from "@flow/flow"

// Module scope, before the editor mounts. The registry starts empty — every
// kind an editor offers is one a host asked for — and this demo is a host that
// wants the package's own five.
registerNodeDefinitions(builtinDefinitions)

const initialGraph = createKeywordSampleGraph()

export default function Page() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor initialGraph={initialGraph} />
    </div>
  )
}
