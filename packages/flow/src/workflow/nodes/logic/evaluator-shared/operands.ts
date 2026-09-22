import type {
  EvaluatorCondition,
  WorkflowEvaluatorOperatorOption,
  WorkflowOperandValue,
  WorkflowTypedValue,
  WorkflowUpstreamValue,
} from "../../../types"
import type { WorkflowVariableType } from "../../../types/variable-types"

const SINGLE_VARIABLE_TEMPLATE_REGEX =
  /^\s*\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}\s*$/

export function createValueOperand(value = ""): WorkflowOperandValue {
  return { type: "value", value }
}

/**
 * The left operand of a node whose comparison target comes from upstream. The
 * backend substitutes the previous node's output, so nothing is stored here.
 */
export function createUpstreamOperand(): WorkflowUpstreamValue {
  return { type: "upstream" }
}

export function normalizeArrayValues(values: string[]): string[] {
  return values.length > 0 ? values : [""]
}

export function createArrayOperand(
  value: string[] = [""]
): WorkflowOperandValue {
  return { type: "array", value: normalizeArrayValues(value) }
}

export function createEmptyOperand(
  type: WorkflowVariableType
): WorkflowOperandValue {
  return type === "array" ? createArrayOperand() : createValueOperand()
}

export function areStringArraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  )
}

export function switchOperandType(
  operand: WorkflowOperandValue,
  nextType: WorkflowVariableType
): WorkflowOperandValue {
  if (operand.type === nextType) {
    return operand
  }

  if (nextType === "value") {
    return createValueOperand(
      operand.type === "array" ? (operand.value[0] ?? "") : ""
    )
  }

  return createArrayOperand(
    operand.type === "value" && operand.value !== "" ? [operand.value] : [""]
  )
}

export function createDefaultCondition(
  operator: WorkflowEvaluatorOperatorOption,
  left: WorkflowTypedValue = createValueOperand()
): EvaluatorCondition {
  return {
    id: crypto.randomUUID(),
    left,
    operator: operator.id,
    ...reconcileRightOperand(undefined, operator),
  }
}

export function getAllowedRightOperandTypes(
  operator: WorkflowEvaluatorOperatorOption | undefined
): WorkflowVariableType[] {
  if (!operator || operator.allowTypes.includes("none")) {
    return []
  }

  return operator.allowTypes.filter(
    (type): type is WorkflowVariableType => type === "value" || type === "array"
  )
}

export function reconcileRightOperand(
  currentRight: WorkflowOperandValue | undefined,
  operator: WorkflowEvaluatorOperatorOption | undefined
): Pick<EvaluatorCondition, "right"> {
  const allowedTypes = getAllowedRightOperandTypes(operator)
  const defaultRightType = allowedTypes[0]

  if (!defaultRightType) {
    return {}
  }

  if (currentRight && allowedTypes.includes(currentRight.type)) {
    return { right: currentRight }
  }

  return { right: createEmptyOperand(defaultRightType) }
}

function parseSingleVariableTemplate(value: string): string | undefined {
  const templateMatch = SINGLE_VARIABLE_TEMPLATE_REGEX.exec(value)
  return templateMatch?.[1]
}

/**
 * `variableTypes` carries opaque tags: the catalog transports whatever a node
 * definition reported without interpreting it. Narrowing is this evaluator's
 * job, and it only ever asks one question — is this operand a list?
 */
export function resolveEffectiveLeftOperandType(
  left: WorkflowTypedValue,
  variableTypes: Record<string, string>
): {
  type: WorkflowVariableType
  unresolvedVariableName?: string
} {
  if (left.type === "array") {
    return { type: "array" }
  }

  // An upstream operand carries no value to inspect; the backend always hands
  // the condition a single value.
  if (left.type === "upstream") {
    return { type: "value" }
  }

  const variableName = parseSingleVariableTemplate(left.value)
  if (!variableName) {
    return { type: "value" }
  }

  const variableType = variableTypes[variableName]
  if (!variableType) {
    return { type: "value", unresolvedVariableName: variableName }
  }

  // A tag this evaluator does not recognise is NOT an unresolved reference:
  // the variable exists, it is simply typed in a vocabulary belonging to
  // someone else. Flagging it would paint every host-defined tag as broken.
  return { type: variableType === "array" ? "array" : "value" }
}
