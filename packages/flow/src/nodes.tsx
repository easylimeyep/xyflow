"use client"

/**
 * `@flow/flow/nodes` — the à la carte counterpart to the package root.
 *
 * The root exports the whole set as `builtinDefinitions` (pass it, or a
 * filtered slice, to `<WorkflowEditor definitions={...} />`). This subpath
 * hands the same definitions out by name so a host can cherry-pick without
 * pulling the aggregate:
 *
 * ```tsx
 * import { evaluator, result } from "@flow/flow/nodes"
 *
 * <WorkflowEditor definitions={[evaluator, result]} />
 * ```
 *
 * Each definition carries its canvas renderer. The single source of truth for
 * the list lives in `workflow/node-registry/builtin-definitions`.
 */
export {
  evaluator,
  setVariable,
  inlineExpression,
  extractor,
  pathExtractor,
  result,
  builtinDefinitions,
  type BuiltinNodeKind,
} from "./workflow/node-registry/builtin-definitions"
