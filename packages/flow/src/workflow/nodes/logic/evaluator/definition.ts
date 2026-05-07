import { Scale } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import {
  DEFAULT_EVALUATOR_OPERATOR_ID,
  type EvaluatorCondition,
} from "../../../types"

function isEvaluatorCondition(value: unknown): value is EvaluatorCondition {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<EvaluatorCondition>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.value === "string" &&
    typeof candidate.operator === "string" &&
    (candidate.targetValue === undefined ||
      typeof candidate.targetValue === "string")
  )
}

export const evaluator = defineNode({
  kind: "evaluator" as const,
  title: "Evaluator",
  description: "Split the flow by condition.",
  icon: Scale,
  category: "logic",
  fields: [],
  outputPaths: ["conditionMatched"],
  allowedTargets: [
    "evaluator",
    "setVariable",
    "inlineExpression",
    "extractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    conditions: [
      {
        id: crypto.randomUUID(),
        value: "",
        operator: DEFAULT_EVALUATOR_OPERATOR_ID,
        targetValue: "",
      } satisfies EvaluatorCondition,
    ],
    logicalOperator: "and" as const,
    caseSensitive: false,
  }),
  subtitle: (config) => {
    const conditions = config.conditions as EvaluatorCondition[] | undefined
    if (!conditions?.length) return "No conditions"
    return `${conditions.length} condition${conditions.length > 1 ? "s" : ""}`
  },
  outputs: [
    {
      id: "evaluator-true",
      top: "34%",
      label: "true",
    },
    {
      id: "evaluator-false",
      top: "72%",
      label: "false",
    },
  ],
  validateConfigValue: (key, value) => {
    switch (key) {
      case "conditions":
        return Array.isArray(value) && value.every(isEvaluatorCondition)
      case "logicalOperator":
        return value === "and" || value === "or"
      case "caseSensitive":
        return typeof value === "boolean"
      default:
        return false
    }
  },
})
