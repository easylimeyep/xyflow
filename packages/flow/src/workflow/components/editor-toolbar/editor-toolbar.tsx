"use client"

import { type ChangeEvent, type Ref, useMemo, useState } from "react"

import { Button } from "@flow/ui/components/button"
import { Textarea } from "@flow/ui/components/textarea"
import { editorToolbarStyles } from "../../../styles/components/editor-shell"
import type { DomainWorkflowDTO } from "../../types"

interface EditorToolbarProps {
  anchorRef?: Ref<HTMLDivElement>
  canUndo: boolean
  canRedo: boolean
  lastError: string | null
  onUndo: () => void
  onRedo: () => void
  onClearError: () => void
  onExportDomain: () => DomainWorkflowDTO
  onImportJson: (rawJson: string) => boolean
  /** Extra classes for the toolbar's root element, merged into the package's own. */
  className?: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
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
  anchorRef,
  className,
}: EditorToolbarProps) {
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const styles = editorToolbarStyles()

  const shownStatus = useMemo(
    () => lastError ?? statusMessage,
    [lastError, statusMessage]
  )

  return (
    <div ref={anchorRef} className={styles.root({ class: className })}>
      <div className={styles.actions()}>
        <Button
          type="button"
          variant="outline"
          onPress={onUndo}
          isDisabled={!canUndo}
        >
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          onPress={onRedo}
          isDisabled={!canRedo}
        >
          Redo
        </Button>
        <Button
          type="button"
          variant="outline"
          onPress={async () => {
            const copied = await copyToClipboard(
              JSON.stringify(onExportDomain(), null, 2)
            )
            setStatusMessage(
              copied ? "Domain JSON copied." : "Failed to copy domain JSON."
            )
          }}
        >
          Export Domain
        </Button>
        <Button
          type="button"
          variant="outline"
          onPress={() => setImportOpen((open) => !open)}
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
            onPress={() => {
              const imported = onImportJson(importText)
              setStatusMessage(
                imported ? "Workflow imported." : "Import failed."
              )
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
            onPress={() => {
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
