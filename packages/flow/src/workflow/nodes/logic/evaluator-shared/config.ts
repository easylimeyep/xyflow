import type {
  NodeVariableReader,
  OutputHandle,
} from "../../../node-registry/define-node"
import { isValidJsIdentifier } from "../../../expression/variable-name"
import {
  EVALUATOR_FALSE_HANDLE,
  EVALUATOR_TRUE_HANDLE,
} from "../../../types/branching"
import type {
  EvaluatorCondition,
  JsonObject,
  WorkflowOperandValue,
  WorkflowTypedValue,
} from "../../../types"
import { createUpstreamOperand, createValueOperand } from "./operands"

function isOperandValue(value: unknown): value is WorkflowOperandValue {
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

function isWorkflowTypedValue(value: unknown): value is WorkflowTypedValue {
  if (isOperandValue(value)) return true

  // An upstream operand is a bare marker: the backend supplies its value.
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "upstream"
  )
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
    (candidate.right === undefined || isOperandValue(candidate.right))
  )
}

/** How a kind sources the left operand of every condition it creates. */
export type EvaluatorLeftOperandSource = "editable" | "upstream"

export function createLeftOperand(
  source: EvaluatorLeftOperandSource
): WorkflowTypedValue {
  return source === "upstream" ? createUpstreamOperand() : createValueOperand()
}

/** The starting config both evaluator kinds share. */
export function buildDefaultEvaluatorConfig(
  leftOperandSource: EvaluatorLeftOperandSource = "editable"
): JsonObject {
  return {
    label: "",
    conditions: [
      {
        id: crypto.randomUUID(),
        left: createLeftOperand(leftOperandSource),
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

/**
 * Both evaluator kinds name their result through the same config key, so they
 * share one reader rather than each carrying a copy.
 *
 * No type tag: an evaluator's result is a branch outcome, and nothing has ever
 * asked whether it is a single value or a list.
 */
export const readEvaluatorVariable: NodeVariableReader = (node) => {
  const configured = node.config.label
  if (typeof configured !== "string") {
    return null
  }

  const name = configured.trim()
  if (name.length === 0 || !isValidJsIdentifier(name)) {
    return null
  }

  return { name }
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
