"use client"

import { WorkflowEditor, builtinDefinitions } from "@flow/flow"

import { tourChainGraph } from "../fixtures"

// Fixture for the "workflow-auto-layout" tour clip (e2e/media). The chain is
// placed in a deliberate tangle so the Auto layout button has something
// visible to tidy up.
const TANGLED_POSITIONS: Record<string, { x: number; y: number }> = {
  "tour-keyword": { x: 40, y: 260 },
  "tour-extract": { x: -60, y: -40 },
  "tour-setter": { x: -260, y: 300 },
  "tour-result": { x: -420, y: -10 },
}

const messyGraph = {
  ...tourChainGraph,
  viewport: { x: 380, y: 140, zoom: 0.7 },
  nodes: tourChainGraph.nodes.map((node) => {
    const offset = TANGLED_POSITIONS[node.id] ?? { x: 0, y: 0 }
    return {
      ...node,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    }
  }),
}

export default function AutoLayoutTourPage() {
  return (
    <div className="h-svh w-screen">
      <WorkflowEditor
        definitions={builtinDefinitions}
        initialGraph={messyGraph}
      />
    </div>
  )
}
