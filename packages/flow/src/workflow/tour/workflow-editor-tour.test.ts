import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../node-registry/registry"
import { WORKFLOW_EDITOR_TOUR } from "./workflow-editor-tour"
import type { WorkflowEditorAnchor, WorkflowTourStep } from "./types"

const editorAnchors = new Set<WorkflowEditorAnchor>([
  "root",
  "toolbar",
  "palette",
  "paletteToggle",
  "canvas",
  "controls",
  "zoomIn",
  "zoomOut",
  "fitView",
  "autoLayout",
  "configPanel",
])

describe("WORKFLOW_EDITOR_TOUR", () => {
  it("exports typed workflow tour steps with valid anchors", () => {
    const steps: readonly WorkflowTourStep[] = WORKFLOW_EDITOR_TOUR
    const nodeKinds = new Set(
      createNodeRegistry(builtinBaseDefinitions).kinds()
    )

    expect(steps.length).toBeGreaterThan(0)

    for (const step of steps) {
      expect(step.id).not.toBe("")
      expect(step.title).not.toBe("")
      expect(step.body).not.toBe("")

      if (step.anchor.type === "editor") {
        expect(editorAnchors.has(step.anchor.id)).toBe(true)
      } else {
        expect(nodeKinds.has(step.anchor.kind)).toBe(true)
      }
    }
  })
})
