import type { Viewport, XYPosition } from "@xyflow/react"

import type { WorkflowNode } from "../types/types"

export function getFallbackPasteAnchor(viewport: Viewport): XYPosition {
  const safeZoom = viewport.zoom === 0 ? 1 : viewport.zoom
  return {
    x: (-viewport.x + 120) / safeZoom,
    y: (-viewport.y + 120) / safeZoom,
  }
}

export function createUniqueLabel(baseLabel: string, usedLabels: Set<string>): string {
  const trimmedBase = baseLabel.trim() || "Node"
  if (!usedLabels.has(trimmedBase)) {
    usedLabels.add(trimmedBase)
    return trimmedBase
  }
  let suffix = 2
  while (usedLabels.has(`${trimmedBase} ${suffix}`)) suffix += 1
  const uniqueLabel = `${trimmedBase} ${suffix}`
  usedLabels.add(uniqueLabel)
  return uniqueLabel
}

export function createUniqueJsIdentifier(
  baseName: string,
  usedIdentifiers: Set<string>
): string {
  const trimmedBase = baseName.trim()
  const baseIdentifier = trimmedBase.length > 0 ? trimmedBase : "myVar"
  if (!usedIdentifiers.has(baseIdentifier)) {
    usedIdentifiers.add(baseIdentifier)
    return baseIdentifier
  }
  let suffix = 2
  while (usedIdentifiers.has(`${baseIdentifier}${suffix}`)) suffix += 1
  const uniqueIdentifier = `${baseIdentifier}${suffix}`
  usedIdentifiers.add(uniqueIdentifier)
  return uniqueIdentifier
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
