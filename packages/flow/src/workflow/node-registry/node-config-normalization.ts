import type {
  JsonObject,
  NodeConfigByKind,
  NodeFieldSchema,
  NodeKind,
} from "../types/types"
import { workflowNodeRegistry } from "./node-definitions"

export function normalizeNodeConfig<K extends NodeKind>(
  kind: K,
  partialConfig: Partial<NodeConfigByKind[K]>
): NodeConfigByKind[K] {
  const definition = workflowNodeRegistry[kind]
  if (!definition) {
    throw new Error(`Unknown node kind: ${kind}`)
  }
  const baseConfig = definition.buildDefaultConfig()
  const result = { ...baseConfig } as Record<string, unknown>
  const rawConfig = partialConfig as Record<string, unknown>

  definition.fields.forEach((field) => {
    const rawValue = rawConfig[field.key]
    if (rawValue === undefined) {
      return
    }

    result[field.key] = coerceFieldValue(field, rawValue, result[field.key])
  })

  return result as NodeConfigByKind[K]
}

function coerceFieldValue(
  field: NodeFieldSchema,
  rawValue: unknown,
  fallback: unknown
): unknown {
  if (field.type === "number") {
    return typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : fallback
  }

  if (field.type === "boolean") {
    return typeof rawValue === "boolean" ? rawValue : fallback
  }

  if (field.type === "select") {
    if (typeof rawValue !== "string") {
      return fallback
    }
    const options = field.options ?? []
    if (options.length === 0) {
      return rawValue
    }
    return options.some((option) => option.value === rawValue) ? rawValue : fallback
  }

  return typeof rawValue === "string" ? rawValue : fallback
}

export function isRecordJsonObject(input: unknown): input is JsonObject {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false
  }

  return true
}
