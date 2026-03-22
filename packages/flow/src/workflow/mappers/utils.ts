import type { Viewport } from "@xyflow/react"

import type { JsonObject, JsonValue } from "../types"

export type UnknownRecord = Record<string, unknown>

export function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

export function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return value as UnknownRecord
}

export function isViewport(value: unknown): value is Viewport {
  const record = asRecord(value)
  if (!record) {
    return false
  }

  return isNumber(record.x) && isNumber(record.y) && isNumber(record.zoom) && record.zoom > 0
}

function toJsonValue(value: unknown): JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item))
  }

  const record = asRecord(value)
  if (!record) {
    return null
  }

  const result: JsonObject = {}
  Object.entries(record).forEach(([key, entryValue]) => {
    result[key] = toJsonValue(entryValue)
  })

  return result
}

export function sanitizeConfigValue(value: JsonValue): JsonValue {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string" || typeof value === "boolean" || value === null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeConfigValue(entry))
  }

  const result: JsonObject = {}
  Object.entries(value).forEach(([key, entryValue]) => {
    result[key] = sanitizeConfigValue(entryValue)
  })
  return result
}

export function toJsonConfig(value: unknown): JsonObject {
  const jsonValue = toJsonValue(value)
  if (typeof jsonValue === "object" && jsonValue !== null && !Array.isArray(jsonValue)) {
    const result: JsonObject = {}
    Object.entries(jsonValue).forEach(([key, entryValue]) => {
      result[key] = sanitizeConfigValue(entryValue)
    })
    return result
  }

  return {}
}

export function normalizeDomainMetadata(metadata: JsonObject): JsonObject {
  return {
    ...metadata,
    source:
      typeof metadata.source === "string" && metadata.source.trim().length > 0
        ? metadata.source
        : "ui",
  }
}
