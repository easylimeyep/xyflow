"use client"

import { useMemo } from "react"

import { useNodeRuntimeState } from "../../runtime"

/** Cap on rendered JSON so an unbounded consumer payload cannot blow up the panel. */
const INSPECTOR_JSON_CAP = 5000

interface NodeInspectorProps {
  nodeId: string
  nodeTitle: string
}

function formatPayload(value: unknown): string {
  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value, null, 2)
    if (serialized == null) {
      return String(value)
    }
    if (serialized.length > INSPECTOR_JSON_CAP) {
      return `${serialized.slice(0, INSPECTOR_JSON_CAP)}\n… (truncated ${
        serialized.length - INSPECTOR_JSON_CAP
      } more characters)`
    }

    return serialized
  } catch {
    return "Unserializable value"
  }
}

function InspectorSection({
  label,
  value,
  defaultOpen,
}: {
  label: string
  value: unknown
  defaultOpen?: boolean
}) {
  const formatted = useMemo(() => formatPayload(value), [value])

  return (
    <details open={defaultOpen} className="rounded-md border bg-muted/20">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground select-none">
        {label}
      </summary>
      <pre
        className="max-h-64 overflow-auto border-t px-3 py-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap"
        data-testid={`node-inspector-${label.toLowerCase()}`}
      >
        {formatted}
      </pre>
    </details>
  )
}

/**
 * Read-only replacement for the config form while observing a run. Renders the
 * selected node's runtime input, output, and error — never an editable field.
 */
export function NodeInspector({ nodeId, nodeTitle }: NodeInspectorProps) {
  const runtime = useNodeRuntimeState(nodeId)
  const hasInput = runtime?.input !== undefined
  const hasOutput = runtime?.output !== undefined
  const hasError = Boolean(runtime?.error)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Node type
        </span>
        <p className="text-sm font-medium">{nodeTitle}</p>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Status
        </span>
        <p
          className="text-sm font-medium capitalize"
          data-testid="inspector-status"
        >
          {runtime?.status ?? "No runtime state"}
        </p>
      </div>

      {runtime?.iteration ? (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Iteration
          </span>
          <p className="font-mono text-sm tabular-nums">
            {runtime.iteration.current} / {runtime.iteration.total}
          </p>
        </div>
      ) : null}

      {hasError ? (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          data-testid="node-inspector-error"
        >
          {runtime?.error}
        </div>
      ) : null}

      {hasInput ? (
        <InspectorSection label="Input" value={runtime?.input} />
      ) : null}
      {hasOutput ? (
        <InspectorSection label="Output" value={runtime?.output} defaultOpen />
      ) : null}

      {!runtime ? (
        <div
          className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground"
          data-testid="node-inspector-empty"
        >
          This node has no runtime state yet.
        </div>
      ) : null}
    </div>
  )
}
