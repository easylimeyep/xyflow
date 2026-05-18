"use client"

import { useRef } from "react"
import {
  WorkflowEditor,
  type WorkflowEditorAnchorElements,
} from "@workspace/flow"

import { ExamplePreview } from "./example-preview"

const code = `import { useMemo, useRef } from "react"
import {
  WORKFLOW_EDITOR_TOUR,
  WorkflowEditor,
  type WorkflowEditorAnchorElements,
  type WorkflowTourAnchor,
} from "@workspace/flow"

function resolveWorkflowTourAnchor(
  anchor: WorkflowTourAnchor,
  anchors: WorkflowEditorAnchorElements
) {
  if (anchor.type === "paletteItem") {
    return anchors.paletteItems?.[anchor.kind] ?? null
  }

  return anchors[anchor.id] ?? null
}

export function Example() {
  const anchorRefs = useRef<WorkflowEditorAnchorElements>({})
  const tourSteps = useMemo(
    () =>
      WORKFLOW_EDITOR_TOUR.map((step) => ({
        ...step,
        target: () => resolveWorkflowTourAnchor(step.anchor, anchorRefs.current),
      })),
    []
  )

  return <WorkflowEditor anchorRefs={anchorRefs} />
}`

export function TourAnchorsExample() {
  const anchorRefs = useRef<WorkflowEditorAnchorElements>({})

  return (
    <ExamplePreview
      title="Tour anchors"
      description="Пример одного mutable anchorRefs registry и lazy target callback для кастомного тура."
      code={code}
    >
      <WorkflowEditor anchorRefs={anchorRefs} />
    </ExamplePreview>
  )
}
