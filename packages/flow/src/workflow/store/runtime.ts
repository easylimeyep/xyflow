import {
  DEFAULT_EVALUATOR_OPERATOR_OPTIONS,
  type WorkflowEvaluatorOperatorAllowType,
  type WorkflowEvaluatorOperatorCatalog,
  type WorkflowEvaluatorOperatorOption,
} from "../types"
import type { WorkflowRuntimeConfig } from "./types"

const ALLOWED_OPERATOR_TYPES = new Set<WorkflowEvaluatorOperatorAllowType>([
  "string",
  "array",
  "none",
])

function normalizeAllowTypes(
  allowTypes: WorkflowEvaluatorOperatorOption["allowTypes"] | undefined
): WorkflowEvaluatorOperatorOption["allowTypes"] | null {
  if (!Array.isArray(allowTypes)) {
    return null
  }

  const normalized: WorkflowEvaluatorOperatorOption["allowTypes"] = []
  const seenTypes = new Set<WorkflowEvaluatorOperatorAllowType>()

  for (const allowType of allowTypes) {
    if (!ALLOWED_OPERATOR_TYPES.has(allowType) || seenTypes.has(allowType)) {
      continue
    }

    seenTypes.add(allowType)
    normalized.push(allowType)
  }

  if (normalized.length === 0) {
    return null
  }

  if (normalized.includes("none") && normalized.length > 1) {
    return null
  }

  return normalized
}

function normalizeEvaluatorOperators(
  operators: WorkflowEvaluatorOperatorOption[] | undefined,
  fallbackOperators: WorkflowEvaluatorOperatorOption[]
): WorkflowEvaluatorOperatorOption[] {
  if (!Array.isArray(operators)) {
    return fallbackOperators
  }

  const normalized: WorkflowEvaluatorOperatorOption[] = []
  const seenIds = new Set<string>()

  for (const operator of operators) {
    const id = operator?.id?.trim()
    const value = operator?.value?.trim()
    const allowTypes = normalizeAllowTypes(operator?.allowTypes)

    if (!id || !value || !allowTypes || seenIds.has(id)) {
      continue
    }

    seenIds.add(id)
    normalized.push({
      id,
      value,
      allowTypes,
    })
  }

  return normalized.length > 0 ? normalized : fallbackOperators
}

function normalizeEvaluatorOperatorCatalog(
  operators: WorkflowEvaluatorOperatorCatalog | undefined
): WorkflowEvaluatorOperatorCatalog {
  if (!operators || Array.isArray(operators)) {
    return DEFAULT_EVALUATOR_OPERATOR_OPTIONS
  }

  return {
    string: normalizeEvaluatorOperators(
      operators.string,
      DEFAULT_EVALUATOR_OPERATOR_OPTIONS.string
    ),
    array: normalizeEvaluatorOperators(
      operators.array,
      DEFAULT_EVALUATOR_OPERATOR_OPTIONS.array
    ),
  }
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
      operators: normalizeEvaluatorOperatorCatalog(
        runtime.evaluator?.operators
      ),
    },
  }
}
