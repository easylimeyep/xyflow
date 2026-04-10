import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"

export const inlineExpression = defineNode({
  kind: "inlineExpression" as const,
  title: "Keyword",
  description: "Edit keyword tokens directly on the node.",
  icon: Braces,
  category: "data",
  fields: [
    {
      key: "template",
      label: "Tokens",
      type: "text",
      ui: "expression",
      placeholder: "{{ myVariable }}",
    },
    {
      key: "isRoot",
      label: "Root",
      type: "boolean",
    },
  ],
  outputPaths: ["template"],
  allowedTargets: [
    "branch",
    "setVariable",
    "inlineExpression",
    "extractor",
    "result",
  ],
  buildDefaultConfig: () => ({
    template: "",
    isRoot: false,
  }),
})
