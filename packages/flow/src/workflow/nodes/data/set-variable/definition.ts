import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"

export const setVariable = defineNode({
  kind: "setVariable" as const,
  title: "Set Variable",
  description: "Create reusable variable value for downstream nodes.",
  icon: Braces,
  category: "data",
  fields: [],
  outputPaths: [],
  allowedTargets: [
    "transform",
    "branch",
    "code",
    "customInput",
    "setVariable",
    "inlineExpression",
  ],
  buildDefaultConfig: () => ({
    variableName: "myVar",
    valueExpression: "{{ $input.item.json }}",
  }),
})
