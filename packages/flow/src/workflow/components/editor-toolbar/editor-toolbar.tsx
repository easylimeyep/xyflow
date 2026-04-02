"use client"

import { type ChangeEvent, useMemo, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { editorToolbarStyles } from "../../../styles/components/editor-shell"

interface EditorToolbarProps {
  canUndo: boolean
  canRedo: boolean
  lastError: string | null
  onUndo: () => void
  onRedo: () => void
  onClearError: () => void
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
  onExportDomain,
  onImportJson,
}: EditorToolbarProps) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const styles = editorToolbarStyles()

  const shownStatus = useMemo(() => lastError ?? statusMessage, [lastError, statusMessage])

  return (
    <div className={styles.root()}>
      <div className={styles.actions()}>
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
        <div className={styles.importPanel()}>
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
        <div className={styles.status()}>
          <span className={styles.statusText()}>{shownStatus}</span>
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
