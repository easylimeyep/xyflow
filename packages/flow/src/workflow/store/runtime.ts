import {
  DEFAULT_BRANCH_OPERATOR_OPTIONS,
  type WorkflowBranchOperatorOption,
} from "../types"
import type { WorkflowRuntimeConfig } from "./types"

function normalizeBranchOperators(
  operators: WorkflowBranchOperatorOption[] | undefined
): WorkflowBranchOperatorOption[] {
  if (!Array.isArray(operators)) {
    return DEFAULT_BRANCH_OPERATOR_OPTIONS
  }

  const normalized: WorkflowBranchOperatorOption[] = []
  const seenIds = new Set<string>()

  for (const operator of operators) {
    const id = operator?.id?.trim()
    const value = operator?.value?.trim()

    if (!id || !value || seenIds.has(id)) {
      continue
    }

    seenIds.add(id)
    normalized.push({
      id,
      value,
      requiresTarget: Boolean(operator.requiresTarget),
    })
  }

  return normalized.length > 0 ? normalized : DEFAULT_BRANCH_OPERATOR_OPTIONS
}

export function normalizeWorkflowRuntimeConfig(
  runtime: WorkflowRuntimeConfig = {}
): WorkflowRuntimeConfig {
  return {
    ...runtime,
    branch: {
      ...runtime.branch,
      operators: normalizeBranchOperators(runtime.branch?.operators),
    },
  }
}
