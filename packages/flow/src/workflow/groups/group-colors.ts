import {
  DEFAULT_WORKFLOW_GROUP_COLOR,
  WORKFLOW_GROUP_COLORS,
  type WorkflowGroupColor,
} from "../types/types"

const KNOWN_GROUP_COLORS: ReadonlySet<string> = new Set(WORKFLOW_GROUP_COLORS)

export function isWorkflowGroupColor(
  value: string
): value is WorkflowGroupColor {
  return KNOWN_GROUP_COLORS.has(value)
}

/**
 * A color token the editor can draw. An unknown token — from a newer editor,
 * or typed by hand — falls back to the default instead of failing the import.
 */
export function normalizeGroupColor(value: string): WorkflowGroupColor {
  return isWorkflowGroupColor(value) ? value : DEFAULT_WORKFLOW_GROUP_COLOR
}
