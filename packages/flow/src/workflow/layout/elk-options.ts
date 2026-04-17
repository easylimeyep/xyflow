export const WORKFLOW_ELK_PADDING = 0.2

export const workflowElkLayoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.spacing.nodeNode": "80",
  "elk.layered.nodePlacement.bk.edgeStraightening": "IMPROVE_STRAIGHTNESS",
} as const

export const WORKFLOW_ELK_PORT_CONSTRAINTS = "FIXED_ORDER"
