import type { WorkflowTourStep } from "./types"

export const WORKFLOW_EDITOR_TOUR = [
  {
    id: "workflow-palette",
    anchor: { type: "editor", id: "palette" },
    title: "Node palette",
    body: "Choose building blocks and add them to the workflow canvas.",
    placement: "left",
  },
  {
    id: "workflow-palette-evaluator",
    anchor: { type: "paletteItem", kind: "evaluator" },
    title: "Evaluator node",
    body: "Split workflow logic by checking a condition and following the matching path.",
    placement: "left",
  },
  {
    id: "workflow-palette-set-variable",
    anchor: { type: "paletteItem", kind: "setVariable" },
    title: "Set variable node",
    body: "Store a value that later workflow steps can reuse.",
    placement: "left",
  },
  {
    id: "workflow-canvas",
    anchor: { type: "editor", id: "canvas" },
    title: "Workflow canvas",
    body: "Arrange nodes, connect paths, and inspect the full workflow structure.",
    placement: "top",
  },
  {
    id: "workflow-zoom-in",
    anchor: { type: "editor", id: "zoomIn" },
    title: "Zoom controls",
    body: "Move closer to inspect dense workflows or step back to review the full flow.",
    placement: "top",
  },
  {
    id: "workflow-auto-layout",
    anchor: { type: "editor", id: "autoLayout" },
    title: "Auto layout",
    body: "Clean up node positions and fit the workflow into a readable layout.",
    placement: "top",
  },
  {
    id: "workflow-config-panel",
    anchor: { type: "editor", id: "configPanel" },
    title: "Config panel",
    body: "Select a node to review its details and adjust its label.",
    placement: "left",
  },
] as const satisfies readonly WorkflowTourStep[]

