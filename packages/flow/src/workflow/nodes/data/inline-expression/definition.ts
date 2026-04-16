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
    {
      key: "repeatable",
      label: "Repeatable",
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
    repeatable: false,
  }),
  validateConfigValue: (key, value) => {
    switch (key) {
      case "template":
        return typeof value === "string"
      case "isRoot":
      case "repeatable":
        return typeof value === "boolean"
      default:
        return false
    }
  },
})
