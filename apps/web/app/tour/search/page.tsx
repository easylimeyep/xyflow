"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { tourSearchGraph } from "../fixtures"

// Fixture for the "workflow-search" tour clip (e2e/media).
export default function SearchTourPage() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={tourSearchGraph}
        autoLayoutOnInit="after-measure"
      />
    </div>
  )
}
