import { GitBranch } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import type { BranchCondition } from "../../types"

export const branch = defineNode({
  kind: "branch" as const,
  title: "Branch",
  description: "Split the flow by condition.",
  icon: GitBranch,
  category: "logic",
  fields: [],
  outputPaths: ["conditionMatched"],
  allowedTargets: [
    "transform",
    "code",
    "customInput",
    "branch",
    "setVariable",
    "inlineExpression",
    "extractor",
  ],
  buildDefaultConfig: () => ({
    conditions: [
      {
        id: crypto.randomUUID(),
        value: "",
        operator: "is equal to",
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
})
