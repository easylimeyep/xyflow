import { CheckCircle } from "lucide-react"

import { defineNode } from "../../node-registry/define-node"

export const result = defineNode({
  kind: "result" as const,
  title: "Result",
  description: "Terminal node that marks the classified outcome of a workflow path.",
  icon: CheckCircle,
  category: "logic",
  fields: [
    {
      key: "category",
      label: "Category",
      type: "select",
      options: [
        { label: "true", value: "true" },
        { label: "false", value: "false" },
      ],
    },
  ],
  outputPaths: [],
  allowedTargets: [],
  buildDefaultConfig: () => ({ category: "true" }),
  validateConfigValue: (key, value) =>
    key === "category" && (value === "true" || value === "false"),
})
