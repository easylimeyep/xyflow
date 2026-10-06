"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { tourChainGraph } from "../fixtures"

// Fixture for the tour clips that start from a tidy chain (e2e/media):
// "workflow-selection" and "workflow-copy-paste".
export default function ChainTourPage() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={tourChainGraph}
        autoLayoutOnInit="after-measure"
      />
    </div>
  )
}
