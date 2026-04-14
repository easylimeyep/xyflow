export type WorkflowErrorCode =
  | "INVALID_CONNECTION"
  | "DUPLICATE_CONNECTION"
  | "CYCLE_DETECTED"
  | "NODE_NOT_FOUND"
  | "EDGE_NOT_FOUND"
  | "INVALID_VARIABLE_NAME"
  | "DUPLICATE_VARIABLE_NAME"
  | "CLIPBOARD_UNAVAILABLE"
  | "CLIPBOARD_WRITE_FAILED"
  | "CLIPBOARD_EMPTY"
  | "IMPORT_INVALID_SCHEMA"
  | "EDGE_INSERT_FAILED"
  | "QUICK_ADD_FAILED"
  | "KIND_RESOLUTION_FAILED"
  | "OUTGOING_CONNECTION_EXISTS"
  | "INVALID_NODE_CONFIG_KIND"
  | "INVALID_NODE_CONFIG_KEY"
  | "INVALID_NODE_CONFIG_VALUE"

export interface WorkflowError {
  code: WorkflowErrorCode
  message: string
  context?: Record<string, unknown>
}

export function createWorkflowError(
  code: WorkflowErrorCode,
  message: string,
  context?: Record<string, unknown>
): WorkflowError {
  return { code, message, context }
}
