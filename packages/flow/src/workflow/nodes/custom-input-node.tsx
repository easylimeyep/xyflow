"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "./node-shell"

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function CustomInputNode({ data }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)

  return (
    <NodeShell
      title={label}
      subtitle={`${asText(config.inputKind)} | retries: ${asNumber(config.retryCount)}`}
    />
  )
}
