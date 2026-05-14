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
    "evaluator",
    "setVariable",
    "inlineExpression",
    "extractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    variableName: "myVar",
    valueExpression: "",
    clear: false,
  }),
  extraExpressionConfigKeys: ["valueExpression"],
  renameConfigKey: "variableName",
  validateConfigValue: (key, value) =>
    ((key === "variableName" || key === "valueExpression") &&
      typeof value === "string") ||
    (key === "clear" && typeof value === "boolean"),
})
