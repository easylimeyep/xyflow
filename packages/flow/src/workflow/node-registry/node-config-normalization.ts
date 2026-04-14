import type { JsonObject, JsonValue } from "../types/types"
import { nodeRegistry, type NodeKind } from "./registry"

export function normalizeNodeConfig(
  kind: NodeKind,
  partialConfig: Record<string, unknown>
): JsonObject {
  const definition = nodeRegistry[kind]
  if (!definition) {
    throw new Error(`Unknown node kind: ${kind}`)
  }
  const baseConfig = definition.buildDefaultConfig()
  const result: JsonObject = sanitizeJsonObject(baseConfig)
  const rawConfig = partialConfig as Record<string, unknown>

  Object.keys(baseConfig).forEach((key) => {
    const rawValue = rawConfig[key]
    if (rawValue === undefined) {
      return
    }

    if (isConfigValueAccepted(definition.validateConfigValue, key, rawValue)) {
      result[key] = sanitizeJsonValue(rawValue)
    }
  })

  return result
}

export function decodeNodeConfig(
  kind: NodeKind,
  value: unknown
): { success: true; config: JsonObject } | { success: false; error: string } {
  if (!isRecordJsonObject(value)) {
    return {
      success: false,
      error: `Node kind ${kind} config must be a JSON object.`,
    }
  }

  const definition = nodeRegistry[kind]
  if (!definition) {
    return {
      success: false,
      error: `Unsupported node kind ${kind}.`,
    }
  }

  const baseConfig = definition.buildDefaultConfig()
  const rawConfig = value as Record<string, unknown>
  const allowedKeys = new Set(Object.keys(baseConfig))

  for (const key of Object.keys(rawConfig)) {
    if (!allowedKeys.has(key)) {
      return {
        success: false,
        error: `Node kind ${kind} does not support config key ${key}.`,
      }
    }
    if (!isConfigValueAccepted(definition.validateConfigValue, key, rawConfig[key])) {
      return {
        success: false,
        error: `Node kind ${kind} has invalid value for config key ${key}.`,
      }
    }
  }

  return {
    success: true,
    config: normalizeNodeConfig(kind, rawConfig),
  }
}

export function isRecordJsonObject(input: unknown): input is JsonObject {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false
  }

  return true
}

function isConfigValueAccepted(
  validateConfigValue: ((key: string, value: unknown) => boolean) | undefined,
  key: string,
  value: unknown
): boolean {
  if (validateConfigValue) {
    return validateConfigValue(key, value)
  }

  return isJsonValue(value)
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean" ||
    value === null
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isJsonValue(entry))
  }

  if (!isRecordJsonObject(value)) {
    return false
  }

  return Object.values(value).every((entry) => isJsonValue(entry))
}

function sanitizeJsonObject(value: Record<string, unknown>): JsonObject {
  const result: JsonObject = {}
  Object.entries(value).forEach(([key, entryValue]) => {
    result[key] = sanitizeJsonValue(entryValue)
  })
  return result
}

function sanitizeJsonValue(value: unknown): JsonValue {
  if (typeof value === "string" || typeof value === "boolean" || value === null) {
    return value
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeJsonValue(entry))
  }

  if (!isRecordJsonObject(value)) {
    return null
  }

  return sanitizeJsonObject(value)
}
