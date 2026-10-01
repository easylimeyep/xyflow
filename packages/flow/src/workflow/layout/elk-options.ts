export const WORKFLOW_ELK_PADDING = 0.2

export const workflowElkLayoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.spacing.nodeNodeBetweenLayers": "160",
  "elk.layered.spacing.edgeNodeBetweenLayers": "48",
  "elk.spacing.nodeNode": "112",
  // Disconnected nodes are packed as separate components; ELK defaults this
  // gap to 20px, which hides each node's add-node button against its neighbour.
  "elk.spacing.componentComponent": "112",
  "elk.spacing.edgeNode": "48",
  "elk.spacing.edgeEdge": "24",
  "elk.layered.nodePlacement.bk.edgeStraightening": "IMPROVE_STRAIGHTNESS",
} as const

export const WORKFLOW_ELK_PORT_CONSTRAINTS = "FIXED_ORDER"
