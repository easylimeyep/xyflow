import type { OutputHandle } from "../../../node-registry/define-node"
import {
  EVALUATOR_FALSE_HANDLE,
  EVALUATOR_TRUE_HANDLE,
} from "../../../types/branching"
import type {
  EvaluatorCondition,
  JsonObject,
  WorkflowTypedValue,
} from "../../../types"

function isWorkflowTypedValue(value: unknown): value is WorkflowTypedValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const candidate = value as { type?: unknown; value?: unknown }
  if (candidate.type === "value") {
    return typeof candidate.value === "string"
  }

  if (candidate.type === "array") {
    return (
      Array.isArray(candidate.value) &&
      candidate.value.every((entry) => typeof entry === "string")
    )
  }

  return false
}

export function isEvaluatorCondition(
  value: unknown
): value is EvaluatorCondition {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<EvaluatorCondition>
  return (
    typeof candidate.id === "string" &&
    isWorkflowTypedValue(candidate.left) &&
    typeof candidate.operator === "string" &&
    (candidate.right === undefined || isWorkflowTypedValue(candidate.right))
  )
}

/** The starting config both evaluator kinds share. */
export function buildDefaultEvaluatorConfig(): JsonObject {
  return {
    label: "",
    conditions: [
      {
        id: crypto.randomUUID(),
        left: { type: "value", value: "" },
        operator: "is equal to",
        right: { type: "value", value: "" },
      } satisfies EvaluatorCondition,
    ],
    logicalOperator: "and",
    caseSensitive: false,
  }
}

/**
 * Validates a config key both evaluator kinds share. Returns `false` for a key
 * it does not own, so a kind with extra keys can chain its own check after it.
 */
export function validateEvaluatorConfigValue(
  key: string,
  value: unknown
): boolean {
  switch (key) {
    case "conditions":
      return Array.isArray(value) && value.every(isEvaluatorCondition)
    case "label":
      return typeof value === "string"
    case "logicalOperator":
      return value === "and" || value === "or"
    case "caseSensitive":
      return typeof value === "boolean"
    default:
      return false
  }
}

export function evaluatorSubtitle(config: { conditions?: unknown }): string {
  const conditions = config.conditions as EvaluatorCondition[] | undefined
  if (!conditions?.length) return "No conditions"
  return `${conditions.length} condition${conditions.length > 1 ? "s" : ""}`
}

/** Branch handles every evaluator kind exposes. */
export const EVALUATOR_OUTPUTS: OutputHandle[] = [
  {
    id: EVALUATOR_TRUE_HANDLE,
    top: "34%",
    label: "true",
  },
  {
    id: EVALUATOR_FALSE_HANDLE,
    top: "72%",
    label: "false",
  },
]

/** Both evaluator kinds accept the same downstream vocabulary. */
export const EVALUATOR_ALLOWED_TARGETS = [
  "evaluator",
  "jsonEvaluator",
  "setVariable",
  "inlineExpression",
  "extractor",
  "pathExtractor",
  "result",
]
