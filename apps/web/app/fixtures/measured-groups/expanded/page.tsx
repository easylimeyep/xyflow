"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { expandedGroupGraph } from "../graphs"

// Fixture for e2e/workflow-measured-layout-groups: an expanded group on a
// canvas that lays itself out once its nodes are measured.
export default function ExpandedGroupFixturePage() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={expandedGroupGraph}
        autoLayoutOnInit="after-measure"
      />
    </div>
  )
}
