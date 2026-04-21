import { GitBranch } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import { DEFAULT_BRANCH_OPERATOR_ID, type BranchCondition } from "../../types"

function isBranchCondition(value: unknown): value is BranchCondition {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<BranchCondition>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.value === "string" &&
    typeof candidate.operator === "string" &&
    (candidate.targetValue === undefined || typeof candidate.targetValue === "string")
  )
}

export const branch = defineNode({
  kind: "branch" as const,
  title: "Branch",
  description: "Split the flow by condition.",
  icon: GitBranch,
  category: "logic",
  fields: [],
  outputPaths: ["conditionMatched"],
  allowedTargets: [
    "branch",
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
        operator: DEFAULT_BRANCH_OPERATOR_ID,
        targetValue: "",
      } satisfies BranchCondition,
    ],
    logicalOperator: "and" as const,
  }),
  subtitle: (config) => {
    const conditions = config.conditions as BranchCondition[] | undefined
    if (!conditions?.length) return "No conditions"
    return `${conditions.length} condition${conditions.length > 1 ? "s" : ""}`
  },
  outputs: [
    {
      id: "branch-true",
      top: "34%",
      label: "true",
    },
    {
      id: "branch-false",
      top: "72%",
      label: "false",
    },
  ],
  validateConfigValue: (key, value) => {
    switch (key) {
      case "conditions":
        return Array.isArray(value) && value.every(isBranchCondition)
      case "logicalOperator":
        return value === "and" || value === "or"
      default:
        return false
    }
  },
})
