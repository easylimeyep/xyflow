import type { Viewport, XYPosition } from "@xyflow/react"

import type { WorkflowNode } from "../types/types"

export function getFallbackPasteAnchor(viewport: Viewport): XYPosition {
  const safeZoom = viewport.zoom === 0 ? 1 : viewport.zoom
  return {
    x: (-viewport.x + 120) / safeZoom,
    y: (-viewport.y + 120) / safeZoom,
  }
}

function createUniqueIdentifier(
  base: string,
  used: Set<string>,
  options: { fallback: string; separator: string }
): string {
  const trimmedBase = base.trim() || options.fallback
  if (!used.has(trimmedBase)) {
    used.add(trimmedBase)
    return trimmedBase
  }
  let suffix = 2
  while (used.has(`${trimmedBase}${options.separator}${suffix}`)) suffix += 1
  const unique = `${trimmedBase}${options.separator}${suffix}`
  used.add(unique)
  return unique
}

export function createUniqueLabel(baseLabel: string, usedLabels: Set<string>): string {
  return createUniqueIdentifier(baseLabel, usedLabels, { fallback: "Node", separator: " " })
}

export function createUniqueJsIdentifier(
  baseName: string,
  usedIdentifiers: Set<string>
): string {
  return createUniqueIdentifier(baseName, usedIdentifiers, { fallback: "myVar", separator: "" })
}

export function deduplicateNodeLabels<T extends { data: { label: string } }>(
  nodes: T[],
  existingLabels: Set<string>
): { nodes: T[]; renames: Array<{ oldLabel: string; newLabel: string }> } {
  const renames: Array<{ oldLabel: string; newLabel: string }> = []
  const deduplicatedNodes = nodes.map((node) => {
    const previousLabel = node.data.label.trim()
    const uniqueLabel = createUniqueLabel(previousLabel, existingLabels)
    if (previousLabel && previousLabel !== uniqueLabel) {
      renames.push({ oldLabel: previousLabel, newLabel: uniqueLabel })
    }
    if (uniqueLabel === node.data.label) {
      return node
    }
    return {
      ...node,
      data: {
        ...node.data,
        label: uniqueLabel,
      },
    }
  })
  return { nodes: deduplicatedNodes, renames }
}

export function getSetVariableNames(nodes: WorkflowNode[]): Set<string> {
  const usedVariableNames = new Set<string>()
  nodes.forEach((node) => {
    if (node.data.kind !== "setVariable") return
    const variableNameValue = node.data.config.variableName
    if (typeof variableNameValue !== "string") return
    const trimmedName = variableNameValue.trim()
    if (trimmedName.length > 0) usedVariableNames.add(trimmedName)
  })
  return usedVariableNames
}
