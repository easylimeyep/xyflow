import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"

export const setVariable = defineNode({
  kind: "setVariable" as const,
  title: "Setter",
  description: "Create reusable variable value for downstream nodes.",
  icon: Braces,
  category: "data",
  fields: [],
  outputPaths: [],
  allowedTargets: [
    "branch",
    "setVariable",
    "inlineExpression",
    "extractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    valueExpression: "",
  }),
  extraExpressionConfigKeys: ["valueExpression"],
})
