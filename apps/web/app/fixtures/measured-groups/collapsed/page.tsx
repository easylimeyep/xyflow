"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { collapsedGroupsGraph } from "../graphs"

// Fixture for e2e/workflow-measured-layout-groups: every node sits in a
// collapsed group, so only group cards are drawn when the canvas lays itself
// out once its nodes are measured.
export default function CollapsedGroupsFixturePage() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={collapsedGroupsGraph}
        autoLayoutOnInit="after-measure"
      />
    </div>
  )
}
