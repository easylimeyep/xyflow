import type {
  NormalizedWorkflowNodeValidationMessage,
  NormalizedWorkflowValidation,
  NormalizedWorkflowValidationMessage,
  WorkflowNodeValidationMessage,
  WorkflowValidationMessage,
  WorkflowValidationSeverity,
  WorkflowValidationSnapshot,
} from "../types/types"
import type { WorkflowSliceCreator, WorkflowStoreState } from "./types"

const GLOBAL_VALIDATION_SCOPE = "__global__"
const DEFAULT_VALIDATION_SEVERITY: WorkflowValidationSeverity = "error"

export interface WorkflowValidationStoreState {
  server: NormalizedWorkflowValidation | null
  locallyHiddenKeys: Set<string>
}

export const EMPTY_WORKFLOW_VALIDATION_STATE: WorkflowValidationStoreState = {
  server: null,
  locallyHiddenKeys: new Set<string>(),
}

export const createValidationSlice: WorkflowSliceCreator = (set) => ({
  validation: EMPTY_WORKFLOW_VALIDATION_STATE,
  setValidation: (snapshot) => {
    if (!snapshot) {
      set((state) =>
        state.validation.server === null &&
        state.validation.locallyHiddenKeys.size === 0
          ? state
          : { validation: createEmptyValidationState() }
      )
      return
    }

    const nextValidation = normalizeWorkflowValidation(snapshot)
    set((state) => {
      const currentRevision = state.validation.server?.revision
      if (
        nextValidation.revision &&
        currentRevision === nextValidation.revision
      ) {
        return state
      }

      return {
        validation: {
          server: nextValidation,
          locallyHiddenKeys: new Set<string>(),
        },
      }
    })
  },
  hideValidationForNode: (nodeId) => {
    set((state) =>
      hideValidationKeys(state, getValidationKeysForNode(state, nodeId))
    )
  },
  hideValidationForNodes: (nodeIds) => {
    set((state) => {
      const keys = new Set<string>()
      nodeIds.forEach((nodeId) => {
        getValidationKeysForNode(state, nodeId).forEach((key) => keys.add(key))
      })
      return hideValidationKeys(state, keys)
    })
  },
  hideGlobalValidation: () => {
    set((state) => hideValidationKeys(state, getGlobalValidationKeys(state)))
  },
  hideAllValidation: () => {
    set((state) => {
      const server = state.validation.server
      if (!server) return state

      const keys = new Set<string>()
      server.global.forEach((message) => keys.add(message.key))
      Object.values(server.nodesById).forEach((messages) => {
        messages.forEach((message) => keys.add(message.key))
      })

      return hideValidationKeys(state, keys)
    })
  },
})

export function normalizeWorkflowValidation(
  snapshot: WorkflowValidationSnapshot
): NormalizedWorkflowValidation {
  const global = (snapshot.global ?? []).map((message, index) =>
    normalizeGlobalValidationMessage(message, index)
  )
  const nodesById: Record<string, NormalizedWorkflowNodeValidationMessage[]> =
    {}

  ;(snapshot.nodes ?? []).forEach((message, index) => {
    const nodeId = message.nodeId.trim()
    if (!nodeId) return

    const normalizedMessage = normalizeNodeValidationMessage(
      { ...message, nodeId },
      index
    )
    const messages = nodesById[nodeId] ?? []
    messages.push(normalizedMessage)
    nodesById[nodeId] = messages
  })

  return {
    workflowId: snapshot.workflowId,
    workflowVersion: snapshot.workflowVersion,
    revision: snapshot.revision,
    global,
    nodesById,
  }
}

export function isValidationMessageVisible(
  state: WorkflowStoreState,
  message: { key: string }
): boolean {
  return !state.validation.locallyHiddenKeys.has(message.key)
}

function normalizeGlobalValidationMessage(
  message: WorkflowValidationMessage,
  index: number
): NormalizedWorkflowValidationMessage {
  return {
    ...message,
    key: createValidationMessageKey(GLOBAL_VALIDATION_SCOPE, message, index),
    severity: normalizeSeverity(message.severity),
  }
}

function normalizeNodeValidationMessage(
  message: WorkflowNodeValidationMessage,
  index: number
): NormalizedWorkflowNodeValidationMessage {
  return {
    ...message,
    key: createValidationMessageKey(message.nodeId, message, index),
    severity: normalizeSeverity(message.severity),
  }
}

function normalizeSeverity(
  severity: WorkflowValidationSeverity | undefined
): WorkflowValidationSeverity {
  return severity ?? DEFAULT_VALIDATION_SEVERITY
}

function createValidationMessageKey(
  scope: string,
  message: WorkflowValidationMessage & { fieldPath?: string },
  index: number
): string {
  if (message.id?.trim()) {
    return `${scope}:id:${message.id.trim()}`
  }

  return [
    scope,
    message.code?.trim() ?? "",
    message.fieldPath?.trim() ?? "",
    message.message.trim(),
    String(index),
  ].join(":")
}

function getValidationKeysForNode(
  state: WorkflowStoreState,
  nodeId: string
): Set<string> {
  const keys = new Set<string>()
  const messages = state.validation.server?.nodesById[nodeId] ?? []
  messages.forEach((message) => keys.add(message.key))
  return keys
}

function getGlobalValidationKeys(state: WorkflowStoreState): Set<string> {
  const keys = new Set<string>()
  state.validation.server?.global.forEach((message) => keys.add(message.key))
  return keys
}

function hideValidationKeys(
  state: WorkflowStoreState,
  keys: Set<string>
): Partial<WorkflowStoreState> | WorkflowStoreState {
  if (keys.size === 0) {
    return state
  }

  const locallyHiddenKeys = new Set(state.validation.locallyHiddenKeys)
  keys.forEach((key) => locallyHiddenKeys.add(key))

  if (locallyHiddenKeys.size === state.validation.locallyHiddenKeys.size) {
    return state
  }

  return {
    validation: {
      ...state.validation,
      locallyHiddenKeys,
    },
  }
}

function createEmptyValidationState(): WorkflowValidationStoreState {
  return {
    server: null,
    locallyHiddenKeys: new Set<string>(),
  }
}
