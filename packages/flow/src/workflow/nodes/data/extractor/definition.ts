import { InfinityIcon } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"

export const extractor = defineNode({
  kind: "extractor" as const,
  title: "Extractor",
  description: "Extract data from the input.",
  icon: InfinityIcon,
  category: "data",
  fields: [
    {
      key: "tokenNumber",
      label: "Token Number",
      type: "number",
    },
    {
      key: "extractExpression",
      label: "Extract Expression",
      type: "text",
      ui: "expression",
      placeholder: '{{ $node("Trigger").item.json.eventName }}',
    },
    {
      key: "unlimited",
      label: "Unlimited",
      type: "boolean",
    },
  ],
  outputPaths: [],
  allowedTargets: [
    "transform",
    "branch",
    "code",
    "customInput",
    "setVariable",
    "inlineExpression",
    "extractor",
  ],
  buildDefaultConfig: () => ({
    tokenNumber: 0,
    extractExpression: "{{ $input.item.json }}",
    unlimited: false,
  }),
})
