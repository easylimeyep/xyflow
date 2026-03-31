import type { WorkflowGraphState } from "../../types/types"
import { buildExpressionSliceState } from "../expression-deps"
import type { WorkflowStoreState } from "../types"

export function createExpressionSlice(
  initialGraph: WorkflowGraphState
): Pick<WorkflowStoreState, "expressionDeps" | "expressionStructuralSignature"> {
  return buildExpressionSliceState(initialGraph)
}
