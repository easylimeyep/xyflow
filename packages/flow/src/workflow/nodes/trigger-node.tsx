"use client"

import type { NodeProps } from "@xyflow/react"

import { NodeShell } from "./node-shell"

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function TriggerNode({ data }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)
  const eventName = asText(config.eventName)
  return (
    <NodeShell
      title={label}
      subtitle={`event: ${eventName || "unset"}`}
      showTarget={false}
    />
  )
}
