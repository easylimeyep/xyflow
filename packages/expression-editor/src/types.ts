export interface ExpressionVariableOption {
  value: string
  label: string
  description: string
  group: string
}

export type ExpressionCommitReason = "blur" | "enter" | "variable-insert"

export type ExpressionCommitEvent =
  | { reason: "blur" }
  | { reason: "enter" }
  | { reason: "variable-insert"; variable: ExpressionVariableOption }
