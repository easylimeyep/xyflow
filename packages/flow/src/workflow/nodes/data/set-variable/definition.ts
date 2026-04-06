import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"

export const setVariable = defineNode({
  kind: "setVariable" as const,
  title: "Concatenate",
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
  ],
  buildDefaultConfig: () => ({
    variableName: "myVar",
    valueExpression: "{{ $input.item.json }}",
  }),
  extraExpressionConfigKeys: ["valueExpression"],
  renameConfigKey: "variableName",
})
