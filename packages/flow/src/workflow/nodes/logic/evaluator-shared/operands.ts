import type {
  EvaluatorCondition,
  WorkflowTypedValue,
  WorkflowEvaluatorOperatorOption,
} from "../../../types"
import type { WorkflowVariableType } from "../../../types/variable-types"

const SINGLE_VARIABLE_TEMPLATE_REGEX =
  /^\s*\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}\s*$/

export function createValueOperand(value = ""): WorkflowTypedValue {
  return { type: "value", value }
}

export function normalizeArrayValues(values: string[]): string[] {
  return values.length > 0 ? values : [""]
}

export function createArrayOperand(value: string[] = [""]): WorkflowTypedValue {
  return { type: "array", value: normalizeArrayValues(value) }
}

export function createEmptyOperand(
  type: WorkflowVariableType
): WorkflowTypedValue {
  return type === "array" ? createArrayOperand() : createValueOperand()
}

export function areStringArraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  )
}

export function switchOperandType(
  operand: WorkflowTypedValue,
  nextType: WorkflowVariableType
): WorkflowTypedValue {
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
  operator: WorkflowEvaluatorOperatorOption
): EvaluatorCondition {
  return {
    id: crypto.randomUUID(),
    left: createValueOperand(),
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
  currentRight: WorkflowTypedValue | undefined,
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

export function resolveEffectiveLeftOperandType(
  left: WorkflowTypedValue,
  variableTypes: Record<string, WorkflowVariableType>
): {
  type: WorkflowVariableType
  unresolvedVariableName?: string
} {
  if (left.type === "array") {
    return { type: "array" }
  }

  const variableName = parseSingleVariableTemplate(left.value)
  if (!variableName) {
    return { type: "value" }
  }

  const variableType = variableTypes[variableName]
  if (!variableType) {
    return { type: "value", unresolvedVariableName: variableName }
  }

  return { type: variableType }
}
