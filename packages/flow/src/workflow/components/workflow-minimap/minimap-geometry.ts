import type { Rect, XYPosition } from "@xyflow/react"

/**
 * The node type of a group frame (see the `workflow-node-groups` change).
 * Frames draw in their own layer beneath the nodes they contain.
 */
export const MINIMAP_FRAME_NODE_TYPE = "groupFrame"

/** Matches React Flow's default mini map node radius, in flow units. */
const MINIMAP_NODE_RADIUS = 5

/** The parts of React Flow's internal node the mini map reads. */
export interface MiniMapSourceNode {
  type?: string
  hidden?: boolean
  internals: { positionAbsolute: XYPosition }
  measured: { width?: number; height?: number }
}

export interface MiniMapGeometry {
  /** Every regular node as one path of rounded rectangles. */
  nodesD: string
  /** Every group frame as one path, drawn beneath `nodesD`. */
  framesD: string
  /** The box around everything drawn; `null` when nothing is. */
  bounds: Rect | null
}

export function isMiniMapFrame(node: MiniMapSourceNode): boolean {
  return node.type === MINIMAP_FRAME_NODE_TYPE
}

/** Short, stable numbers: path strings for hundreds of nodes add up. */
function format(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const r = Math.min(MINIMAP_NODE_RADIUS, width / 2, height / 2)
  const arc = (dx: number, dy: number) =>
    `a${format(r)} ${format(r)} 0 0 1 ${format(dx)} ${format(dy)}`

  return [
    `M${format(x + r)} ${format(y)}`,
    `h${format(width - 2 * r)}`,
    arc(r, r),
    `v${format(height - 2 * r)}`,
    arc(-r, r),
    `h${format(-(width - 2 * r))}`,
    arc(-r, -r),
    `v${format(-(height - 2 * r))}`,
    arc(r, -r),
    "Z",
  ].join("")
}

/**
 * Turns the nodes into the mini map's two path layers and their bounds.
 * Hidden nodes and nodes React Flow has not measured yet are left out, as
 * React Flow's own mini map does.
 */
export function buildMiniMapGeometry(
  nodes: Iterable<MiniMapSourceNode>
): MiniMapGeometry {
  const nodeParts: string[] = []
  const frameParts: string[] = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of nodes) {
    const { width, height } = node.measured
    if (node.hidden || !width || !height) {
      continue
    }

    const { x, y } = node.internals.positionAbsolute
    const parts = isMiniMapFrame(node) ? frameParts : nodeParts
    parts.push(roundedRectPath(x, y, width, height))
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  }

  const hasShapes = nodeParts.length > 0 || frameParts.length > 0
  return {
    nodesD: nodeParts.join(""),
    framesD: frameParts.join(""),
    bounds: hasShapes
      ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
      : null,
  }
}
