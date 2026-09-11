import {
  DEFAULT_EVALUATOR_OPERATOR_OPTIONS,
  type FieldOption,
  type WorkflowEvaluatorOperatorAllowType,
  type WorkflowEvaluatorOperatorCatalog,
  type WorkflowEvaluatorOperatorOption,
} from "../types"
import type {
  WorkflowNodeOptionsCatalog,
  WorkflowRuntimeConfig,
} from "./types"

const ALLOWED_OPERATOR_TYPES = new Set<WorkflowEvaluatorOperatorAllowType>([
  "value",
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
    value: normalizeEvaluatorOperators(
      operators.value,
      DEFAULT_EVALUATOR_OPERATOR_OPTIONS.value
    ),
    array: normalizeEvaluatorOperators(
      operators.array,
      DEFAULT_EVALUATOR_OPERATOR_OPTIONS.array
    ),
  }
}

/**
 * One select's choices, or `null` when the host listed nothing usable — the
 * caller drops the key at that point so the node keeps its built-in list
 * rather than rendering an empty select.
 */
function normalizeNodeSelectOptions(options: unknown): FieldOption[] | null {
  if (!Array.isArray(options)) {
    return null
  }

  const normalized: FieldOption[] = []
  const seenValues = new Set<string>()

  for (const option of options) {
    if (typeof option !== "object" || option === null) {
      continue
    }

    const candidate = option as Partial<FieldOption>
    const value =
      typeof candidate.value === "string" ? candidate.value.trim() : ""
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : ""

    if (!value || seenValues.has(value)) {
      continue
    }

    seenValues.add(value)
    normalized.push({ value, label: label || value })
  }

  return normalized.length > 0 ? normalized : null
}

function normalizeNodeOptionsCatalog(
  catalog: WorkflowNodeOptionsCatalog | undefined
): WorkflowNodeOptionsCatalog | undefined {
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    return undefined
  }

  const normalized: WorkflowNodeOptionsCatalog = {}

  for (const [kind, keyedOptions] of Object.entries(catalog)) {
    if (
      !kind.trim() ||
      typeof keyedOptions !== "object" ||
      keyedOptions === null ||
      Array.isArray(keyedOptions)
    ) {
      continue
    }

    const normalizedKeys: Record<string, FieldOption[]> = {}

    for (const [configKey, options] of Object.entries(keyedOptions)) {
      const normalizedOptions = normalizeNodeSelectOptions(options)
      if (!configKey.trim() || !normalizedOptions) {
        continue
      }
      normalizedKeys[configKey] = normalizedOptions
    }

    if (Object.keys(normalizedKeys).length > 0) {
      normalized[kind] = normalizedKeys
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export function normalizeWorkflowRuntimeConfig(
  runtime: WorkflowRuntimeConfig = {}
): WorkflowRuntimeConfig {
  return {
    ...runtime,
    enableEvaluatorMultipleConditions:
      runtime.enableEvaluatorMultipleConditions ?? false,
    nodeOptions: normalizeNodeOptionsCatalog(runtime.nodeOptions),
    evaluator: {
      ...runtime.evaluator,
      operators: normalizeEvaluatorOperatorCatalog(
        runtime.evaluator?.operators
      ),
    },
  }
}
