import {
  DEFAULT_EVALUATOR_OPERATOR_OPTIONS,
  type WorkflowEvaluatorOperatorOption,
} from "../types"
import type { WorkflowRuntimeConfig } from "./types"

function normalizeEvaluatorOperators(
  operators: WorkflowEvaluatorOperatorOption[] | undefined
): WorkflowEvaluatorOperatorOption[] {
  if (!Array.isArray(operators)) {
    return DEFAULT_EVALUATOR_OPERATOR_OPTIONS
  }

  const normalized: WorkflowEvaluatorOperatorOption[] = []
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

  return normalized.length > 0 ? normalized : DEFAULT_EVALUATOR_OPERATOR_OPTIONS
}

export function normalizeWorkflowRuntimeConfig(
  runtime: WorkflowRuntimeConfig = {}
): WorkflowRuntimeConfig {
  return {
    ...runtime,
    enableEvaluatorMultipleConditions:
      runtime.enableEvaluatorMultipleConditions ?? false,
    evaluator: {
      ...runtime.evaluator,
      operators: normalizeEvaluatorOperators(runtime.evaluator?.operators),
    },
  }
}
