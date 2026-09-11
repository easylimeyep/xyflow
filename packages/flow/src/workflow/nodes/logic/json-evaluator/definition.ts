import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import type { EvaluatorMatchType } from "../../../types"
import {
  buildDefaultEvaluatorConfig,
  evaluatorSubtitle,
  EVALUATOR_ALLOWED_TARGETS,
  EVALUATOR_OUTPUTS,
  validateEvaluatorConfigValue,
} from "../evaluator-shared/config"
import { isSelectConfigValue } from "../../shared/node-data-utils"

export const jsonEvaluator = defineNode({
  kind: "jsonEvaluator" as const,
  title: "JSON Evaluator",
  description: "Split the flow by condition over a JSON payload.",
  icon: Braces,
  category: "logic",
  fields: [],
  outputPaths: [],
  allowedTargets: EVALUATOR_ALLOWED_TARGETS,
  buildDefaultConfig: () => ({
    ...buildDefaultEvaluatorConfig(),
    matchType: "any" satisfies EvaluatorMatchType,
  }),
  renameConfigKey: "label",
  subtitle: evaluatorSubtitle,
  outputs: EVALUATOR_OUTPUTS,
  validateConfigValue: (key, value) =>
    key === "matchType"
      ? isSelectConfigValue(value)
      : validateEvaluatorConfigValue(key, value),
})
