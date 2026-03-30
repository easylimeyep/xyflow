import { GitBranch } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"
import { asText } from "../shared"

export const branch = defineNode({
  kind: "branch" as const,
  title: "Branch",
  description: "Split the flow by condition.",
  icon: GitBranch,
  category: "logic",
  fields: [
    {
      key: "condition",
      label: "Condition",
      type: "textarea",
      ui: "expression",
      placeholder: "node.inputText contains 'access-list'",
    },
  ],
  outputPaths: ["conditionMatched"],
  allowedTargets: [
    "transform",
    "code",
    "customInput",
    "branch",
    "setVariable",
    "inlineExpression",
  ],
  buildDefaultConfig: () => ({ condition: "true" }),
  subtitle: (config) => asText(config.condition),
  outputs: [
    {
      id: "branch-true",
      top: "34%",
      label: "true",
      labelClassName: "font-medium text-emerald-600",
    },
    {
      id: "branch-false",
      top: "72%",
      label: "false",
      labelClassName: "font-medium text-rose-600",
    },
  ],
})
