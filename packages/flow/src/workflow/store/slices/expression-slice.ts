import type { VariableScopeResolver } from "../../expression/variables/variable-scope"
import type { NodeRegistry } from "../../node-registry/registry"
import type { WorkflowGraphState } from "../../types/types"
import { buildExpressionSliceState } from "../expression-deps"
import type { WorkflowStoreState } from "../types"

export function createExpressionSlice(
  initialGraph: WorkflowGraphState,
  registry: NodeRegistry,
  scope: VariableScopeResolver
): Pick<
  WorkflowStoreState,
  | "expressionDeps"
  | "expressionStructuralVersion"
  | "expressionStructuralSignature"
  | "expressionCatalogCache"
  | "expressionVariableTypesCache"
> {
  return buildExpressionSliceState(initialGraph, registry, scope)
}
