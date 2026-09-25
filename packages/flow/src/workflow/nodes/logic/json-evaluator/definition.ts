import { Braces } from "lucide-react"

import { defineNode } from "../../../node-registry/define-node"
import type { EvaluatorMatchType } from "../../../types"
import {
  buildDefaultEvaluatorConfig,
  evaluatorSubtitle,
  EVALUATOR_ALLOWED_TARGETS,
  EVALUATOR_OUTPUTS,
  readEvaluatorVariable,
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
    // The backend substitutes the previous node's output for every left
    // operand, so conditions start with an upstream marker instead of a value.
    ...buildDefaultEvaluatorConfig("upstream"),
    matchType: "any" satisfies EvaluatorMatchType,
  }),
  renameConfigKey: "label",
  subtitle: evaluatorSubtitle,
  outputs: EVALUATOR_OUTPUTS,
  // A JSON payload routes to several consumers per outcome; the plain
  // evaluator keeps its one-target-per-branch contract.
  multipleBranchTargets: true,
  variable: readEvaluatorVariable,
  validateConfigValue: (key, value) =>
    key === "matchType"
      ? isSelectConfigValue(value)
      : validateEvaluatorConfigValue(key, value),
})
