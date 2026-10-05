"use client"

import { EditorView, type ViewUpdate } from "@codemirror/view"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@flow/ui/components/command"
import { FieldError } from "@flow/ui/components/field"
import { Popover } from "@flow/ui/components/popover"
import CodeMirror from "@uiw/react-codemirror"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createTemplateHighlightExtension } from "../../highlighting/highlighting"
import {
  buildExpressionInsertion,
  validateTemplateExpression,
} from "../../template"
import type {
  ExpressionCommitEvent,
  ExpressionVariableOption,
} from "../../types"
import { expressionEditorStyles } from "./expression-editor.styles"
import {
  ExpressionPreview,
  type ExpressionPreviewPoint,
} from "./expression-preview"

export interface ExpressionEditorProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  onCommit: (nextValue: string, event: ExpressionCommitEvent) => void
  onLiveChange?: (nextValue: string) => void
  /**
   * Draws a static preview and creates the CodeMirror editor only once the
   * field is pressed or focused, dropping it again on blur. Meant for screens
   * that show many expression fields at once, such as a large canvas.
   */
  mountOnFocus?: boolean
}

export function ExpressionEditor({
  value,
  placeholder,
  variables,
  onCommit,
  onLiveChange,
  mountOnFocus = false,
}: ExpressionEditorProps) {
  const editorViewRef = useRef<EditorView | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerOpenRef = useRef(pickerOpen)
  useEffect(() => {
    pickerOpenRef.current = pickerOpen
  }, [pickerOpen])
  const [isEditorActive, setEditorActive] = useState(!mountOnFocus)
  const isEditorMounted = !mountOnFocus || isEditorActive
  // Where the press that activated the editor landed, so the caret goes there
  // instead of to the start of the text.
  const activationPointRef = useRef<ExpressionPreviewPoint | null>(null)
  const activateEditor = useCallback((point: ExpressionPreviewPoint | null) => {
    activationPointRef.current = point
    setEditorActive(true)
  }, [])
  // The picker takes focus from the editor while it is open; the editor only
  // goes back to its preview once focus has really left the field.
  const releaseEditorRef = useRef(() => {})
  useEffect(() => {
    releaseEditorRef.current = () => {
      if (mountOnFocus && !pickerOpenRef.current) {
        setEditorActive(false)
      }
    }
  }, [mountOnFocus])
  useEffect(() => {
    if (!isEditorMounted) {
      editorViewRef.current = null
    }
  }, [isEditorMounted])
  const handlePickerOpenChange = useCallback(
    (isOpen: boolean) => {
      setPickerOpen(isOpen)
      if (isOpen || !mountOnFocus) {
        return
      }

      // Dismissed without picking: once the popover has handed focus back,
      // the editor goes too unless focus really returned to it.
      window.requestAnimationFrame(() => {
        if (!editorViewRef.current?.hasFocus) {
          setEditorActive(false)
        }
      })
    },
    [mountOnFocus]
  )

  // Internal live value for validation display. The committed `value` prop is
  // only updated on commit, so validation must read from the live editor text.
  const [liveValue, setLiveValue] = useState(value)

  useEffect(() => {
    setLiveValue(value)
  }, [value])

  // The text last handed to `onCommit` while `value` has not caught up yet, so
  // a blur followed by an unmount does not commit the same edit twice.
  const pendingCommitRef = useRef<string | null>(null)
  const commitRef = useRef<(event: ExpressionCommitEvent) => void>(() => {})
  useEffect(() => {
    pendingCommitRef.current = null
    commitRef.current = (event) => {
      const currentDoc = editorViewRef.current?.state.doc.toString()
      if (
        currentDoc !== undefined &&
        currentDoc !== value &&
        currentDoc !== pendingCommitRef.current
      ) {
        pendingCommitRef.current = currentDoc
        onCommit(currentDoc, event)
      }
    }
  }, [onCommit, value])
  // CodeMirror reports a lost focus a tick late, and a host may drop the field
  // before then — a canvas swapping a node for its compact card, say. Commit
  // whatever is still pending, or the edit is lost with the editor.
  useEffect(
    () => () => {
      commitRef.current({ reason: "blur" })
    },
    []
  )

  // Read through a ref so a parent passing a fresh listener each render does
  // not hand CodeMirror a new change handler, which would make it reconfigure.
  const liveChangeRef = useRef(onLiveChange)
  useEffect(() => {
    liveChangeRef.current = onLiveChange
  }, [onLiveChange])

  // Only the live editor needs these; a preview skips the work.
  const groupedVariables = useMemo(
    () => (isEditorMounted ? groupVariablesBySection(variables) : []),
    [isEditorMounted, variables]
  )
  const validation = useMemo(
    () => validateTemplateExpression(liveValue),
    [liveValue]
  )
  const styles = expressionEditorStyles()
  const templateHighlightExtension = useMemo(
    () => (isEditorMounted ? createTemplateHighlightExtension(variables) : []),
    [isEditorMounted, variables]
  )

  // CodeMirror extensions are intentionally stable and read the latest commit
  // callback through a ref when editor events fire.
  const commitExtension = useMemo(
    () => [
      // eslint-disable-next-line react-hooks/refs
      EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.focusChanged && !vu.view.hasFocus) {
          commitRef.current({ reason: "blur" })
          releaseEditorRef.current()
        }
      }),
      // eslint-disable-next-line react-hooks/refs
      EditorView.domEventHandlers({
        keydown(event, view) {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            commitRef.current({ reason: "enter" })
            view.dom.blur()
            return true
          }
        },
      }),
    ],
    []
  )

  const extensions = useMemo(
    () => [templateHighlightExtension, commitExtension],
    [commitExtension, templateHighlightExtension]
  )
  const basicSetup = useMemo(
    () => ({
      foldGutter: false,
      highlightActiveLine: false,
      lineNumbers: false,
      // Leaves Mod+F unbound, so it reaches the host: the workflow editor
      // opens its canvas-wide search from inside expression fields too.
      searchKeymap: false,
    }),
    []
  )

  const insertVariable = useCallback(
    (option: ExpressionVariableOption) => {
      const insertion = buildExpressionInsertion(option.value)
      const editorView = editorViewRef.current
      if (!editorView) {
        const currentValue = value
        const endsWithWrappedPlaceholder = currentValue.endsWith("{{}}")
        const replaceTypedTrigger = currentValue.endsWith("{{")
        const nextValue = endsWithWrappedPlaceholder
          ? `${currentValue.slice(0, Math.max(0, currentValue.length - 4))}${insertion}`
          : replaceTypedTrigger
            ? `${currentValue.slice(0, Math.max(0, currentValue.length - 2))}${insertion}`
            : `${currentValue}${insertion}`
        if (nextValue !== currentValue) {
          onCommit(nextValue, { reason: "variable-insert", variable: option })
        }
        setPickerOpen(false)
        return
      }

      const selection = editorView.state.selection.main
      const docText = editorView.state.doc.toString()
      const hasTypedTrigger =
        selection.empty &&
        selection.from >= 2 &&
        editorView.state.doc.sliceString(selection.from - 2, selection.from) ===
          "{{"
      const hasTypedClosingBraces =
        hasTypedTrigger &&
        editorView.state.doc.sliceString(selection.to, selection.to + 2) ===
          "}}"
      const trailingWrappedPlaceholderStart = docText.endsWith("{{}}")
        ? docText.length - "{{}}".length
        : -1
      const shouldReplaceTrailingWrappedPlaceholder =
        !hasTypedTrigger && trailingWrappedPlaceholderStart >= 0
      const replaceFrom = shouldReplaceTrailingWrappedPlaceholder
        ? trailingWrappedPlaceholderStart
        : hasTypedTrigger
          ? selection.from - 2
          : selection.from
      const replaceTo = shouldReplaceTrailingWrappedPlaceholder
        ? docText.length
        : hasTypedClosingBraces
          ? selection.to + 2
          : selection.to
      const nextValue = `${docText.slice(0, replaceFrom)}${insertion}${docText.slice(replaceTo)}`
      editorView.dispatch({
        changes: {
          from: replaceFrom,
          to: replaceTo,
          insert: insertion,
        },
        selection: {
          anchor: replaceFrom + insertion.length,
        },
      })
      if (nextValue !== value) {
        onCommit(nextValue, { reason: "variable-insert", variable: option })
      }
      editorView.focus()
      setPickerOpen(false)
    },
    [onCommit, value]
  )

  const handleCreateEditor = useCallback(
    (nextEditorView: EditorView) => {
      editorViewRef.current = nextEditorView
      if (!mountOnFocus) {
        return
      }

      // Created because the user pressed or focused the preview: hand the
      // focus on, with the caret where the press landed.
      const point = activationPointRef.current
      activationPointRef.current = null
      const anchor = point ? nextEditorView.posAtCoords(point) : null
      nextEditorView.focus()
      if (anchor != null) {
        nextEditorView.dispatch({ selection: { anchor } })
      }
    },
    [mountOnFocus]
  )

  const handleChange = useCallback(
    (nextValue: string, viewUpdate: ViewUpdate) => {
      setLiveValue(nextValue)
      liveChangeRef.current?.(nextValue)

      if (pickerOpen) {
        return
      }

      const nextCursor = viewUpdate.state.selection.main.head
      const prevCursor = viewUpdate.startState.selection.main.head
      const previousValue = viewUpdate.startState.doc.toString()
      const hasWrappedTriggerAtCursor = (source: string, cursor: number) =>
        source.slice(Math.max(0, cursor - 2), cursor) === "{{" &&
        source.slice(cursor, cursor + 2) === "}}"

      const justTypedWrappedTrigger =
        hasWrappedTriggerAtCursor(nextValue, nextCursor) &&
        !hasWrappedTriggerAtCursor(previousValue, prevCursor)
      if (justTypedWrappedTrigger) {
        // Set now, not in the effect: the picker takes focus as it opens, and
        // the editor must already know not to give way to its preview.
        pickerOpenRef.current = true
        setPickerOpen(true)
      }
    },
    [pickerOpen]
  )

  return (
    <div className={styles.root()}>
      <div
        ref={anchorRef}
        className={styles.editorContainer()}
        onWheelCapture={(event) => {
          event.stopPropagation()
        }}
      >
        {isEditorMounted ? (
          <CodeMirror
            value={liveValue}
            placeholder={placeholder}
            minHeight="26px"
            basicSetup={basicSetup}
            extensions={extensions}
            onCreateEditor={handleCreateEditor}
            onChange={handleChange}
          />
        ) : (
          <ExpressionPreview
            value={liveValue}
            placeholder={placeholder}
            variables={variables}
            onActivate={activateEditor}
          />
        )}
      </div>
      {isEditorMounted ? (
        <Popover
          triggerRef={anchorRef}
          isOpen={pickerOpen}
          onOpenChange={handlePickerOpenChange}
          placement="bottom start"
          className={styles.popoverContent()}
        >
          <Command>
            <CommandInput placeholder="Search variables..." />
            <CommandList
              renderEmptyState={() => (
                <CommandEmpty>No variables available.</CommandEmpty>
              )}
            >
              {groupedVariables.map(([group, options]) => (
                <CommandGroup key={group} heading={group}>
                  {options.map((option) => (
                    <CommandItem
                      key={`${group}-${option.value}`}
                      textValue={`${option.label} ${option.description}`}
                      onAction={() => insertVariable(option)}
                    >
                      <div className={styles.commandItemContent()}>
                        <span className={styles.commandItemLabel()}>
                          {option.label}
                        </span>
                        <span className={styles.commandItemDescription()}>
                          {option.description}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </Popover>
      ) : null}

      {!validation.valid ? <FieldError errors={validation.errors} /> : null}
    </div>
  )
}

function groupVariablesBySection(
  variables: ExpressionVariableOption[]
): Array<[string, ExpressionVariableOption[]]> {
  const grouped = new Map<string, ExpressionVariableOption[]>()
  variables.forEach((variable) => {
    const existing = grouped.get(variable.group) ?? []
    existing.push(variable)
    grouped.set(variable.group, existing)
  })

  return Array.from(grouped.entries())
}
