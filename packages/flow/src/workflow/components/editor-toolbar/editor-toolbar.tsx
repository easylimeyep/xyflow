"use client"

import { type ChangeEvent, useMemo, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"

interface EditorToolbarProps {
  canUndo: boolean
  canRedo: boolean
  lastError: string | null
  onUndo: () => void
  onRedo: () => void
  onClearError: () => void
  onExportInternal: () => string
  onExportDomain: () => string
  onImportJson: (rawJson: string) => boolean
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function EditorToolbar({
  canUndo,
  canRedo,
  lastError,
  onUndo,
  onRedo,
  onClearError,
  onExportInternal,
  onExportDomain,
  onImportJson,
}: EditorToolbarProps) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const shownStatus = useMemo(() => lastError ?? statusMessage, [lastError, statusMessage])

  return (
    <div className="space-y-2 border-b bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={onUndo} disabled={!canUndo}>
          Undo
        </Button>
        <Button type="button" variant="outline" onClick={onRedo} disabled={!canRedo}>
          Redo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const copied = await copyToClipboard(onExportInternal())
            setStatusMessage(copied ? "Internal JSON copied." : "Failed to copy internal JSON.")
          }}
        >
          Export Internal
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const copied = await copyToClipboard(onExportDomain())
            setStatusMessage(copied ? "Domain JSON copied." : "Failed to copy domain JSON.")
          }}
        >
          Export Domain
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setImportOpen((open) => !open)}
        >
          {importOpen ? "Close Import" : "Import JSON"}
        </Button>
      </div>

      {importOpen ? (
        <div className="space-y-2">
          <Textarea
            rows={8}
            value={importText}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setImportText(event.target.value)
            }
            placeholder="Paste domain workflow JSON"
          />
          <Button
            type="button"
            onClick={() => {
              const imported = onImportJson(importText)
              setStatusMessage(imported ? "Workflow imported." : "Import failed.")
            }}
          >
            Apply Import
          </Button>
        </div>
      ) : null}

      {shownStatus ? (
        <div className="flex items-center justify-between rounded-md border px-2 py-1">
          <span className="text-xs">{shownStatus}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setStatusMessage(null)
              onClearError()
            }}
          >
            Dismiss
          </Button>
        </div>
      ) : null}
    </div>
  )
}
