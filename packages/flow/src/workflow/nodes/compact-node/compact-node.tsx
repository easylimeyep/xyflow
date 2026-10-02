"use client"

import {
  Handle,
  Position,
  useStore,
  type NodeProps,
  type ReactFlowState,
} from "@xyflow/react"
import { useMemo } from "react"
import { shallow } from "zustand/shallow"

import {
  compactNodeStyles,
  nodeHandlesStyles,
} from "../../../styles/components/nodes"
import { getEstimatedNodeHeight } from "../../layout/node-size-estimate"
import { resolveWorkflowLayoutPorts } from "../../layout/elk-ports"
import type { NodeDefinition } from "../../node-registry/define-node"
import { DEFAULT_NODE_WIDTH } from "../../node-registry/node-factory"
import {
  selectNodeHasVisibleValidation,
  selectNodeRegistry,
  selectNodeSearchStatus,
  useWorkflowShallowStore,
} from "../../store"
import type { WorkflowNode, WorkflowNodeData } from "../../types"
import { useBaseNodeData } from "../shared/use-base-node-data"

/**
 * Below this zoom a node is drawn as a title-only card. Its fields are
 * unreadable that far out anyway, and the full views — expression fields,
 * selects, menus — are what makes the first render of a large graph slow.
 */
export const COMPACT_NODE_MAX_ZOOM = 0.4

/**
 * How far past each viewport edge, as a share of the viewport, nodes still
 * render in full, so a short pan does not reveal compact cards.
 */
const VIEWPORT_MARGIN_RATIO = 0.5

function isOutsideViewport(state: ReactFlowState, nodeId: string): boolean {
  const node = state.nodeLookup.get(nodeId)
  // Until the pane is measured there is no viewport to compare against.
  if (!node || state.width === 0 || state.height === 0) {
    return false
  }

  const [translateX, translateY, zoom] = state.transform
  const viewWidth = state.width / zoom
  const viewHeight = state.height / zoom
  const left = -translateX / zoom - viewWidth * VIEWPORT_MARGIN_RATIO
  const top = -translateY / zoom - viewHeight * VIEWPORT_MARGIN_RATIO
  const right = left + viewWidth * (1 + 2 * VIEWPORT_MARGIN_RATIO)
  const bottom = top + viewHeight * (1 + 2 * VIEWPORT_MARGIN_RATIO)
  const { x, y } = node.internals.positionAbsolute
  const width = node.measured.width ?? DEFAULT_NODE_WIDTH
  const height = node.measured.height ?? 0

  return x + width < left || x > right || y + height < top || y > bottom
}

/**
 * True when the node should draw its compact card: the canvas is zoomed out
 * too far to read it, or it sits well away from the viewport. Hundreds of full
 * views mounting at once — on the first render, or when zooming in past the
 * threshold — is what freezes the page on a large graph.
 */
export function useIsCompactNode(nodeId: string): boolean {
  return useStore(
    (state: ReactFlowState) =>
      (state.transform[2] ?? 1) < COMPACT_NODE_MAX_ZOOM ||
      isOutsideViewport(state, nodeId)
  )
}

interface NodeBox {
  width?: number
  height?: number
}

function useMeasuredBox(nodeId: string): NodeBox | undefined {
  return useStore(
    (state: ReactFlowState) => state.nodeLookup.get(nodeId)?.measured,
    shallow
  )
}

interface CompactNodeProps extends NodeProps {
  definition: NodeDefinition
}

export function CompactNode({
  id,
  data,
  selected,
  definition,
}: CompactNodeProps) {
  const { label } = useBaseNodeData(data)
  const node = useMemo(
    () => ({ id, data: data as WorkflowNodeData }) as WorkflowNode,
    [data, id]
  )
  const { registry, searchState, hasValidation } = useWorkflowShallowStore(
    (state) => ({
      registry: selectNodeRegistry(state),
      searchState: selectNodeSearchStatus(state, id),
      hasValidation: selectNodeHasVisibleValidation(state, id),
    })
  )
  const ports = resolveWorkflowLayoutPorts(registry, node)
  // Keep the box the full node was last measured at, so swapping views never
  // moves an edge; before any measurement, use the box the layout assumed.
  const measured = useMeasuredBox(id)
  const width = measured?.width ?? DEFAULT_NODE_WIDTH
  const height = measured?.height ?? getEstimatedNodeHeight(node)
  const styles = compactNodeStyles({
    selected,
    validation: hasValidation,
    searchState,
  })
  const handleStyles = nodeHandlesStyles({ kind: "target" })
  const outputTops = new Map(
    (definition.outputs ?? []).map((handle) => [handle.id ?? null, handle.top])
  )

  return (
    <div
      className={styles.root()}
      style={{ width, height }}
      data-testid="workflow-node-compact"
      data-node-id={id}
      data-selected={selected ? "true" : undefined}
      data-search-state={searchState === "none" ? undefined : searchState}
    >
      {ports.hasTargetPort ? (
        <Handle
          type="target"
          position={Position.Left}
          className={handleStyles.handleBase()}
        />
      ) : null}
      <div className={styles.panel()}>
        <span className={styles.title()}>{label}</span>
      </div>
      {ports.outputHandles.map((handle) => (
        <div
          key={handle.id ?? "default"}
          className={styles.output()}
          style={{ top: outputTops.get(handle.id) ?? "50%", right: 0 }}
        >
          <Handle
            id={handle.id ?? undefined}
            type="source"
            position={Position.Right}
            className={handleStyles.handleBase()}
          />
        </div>
      ))}
    </div>
  )
}
