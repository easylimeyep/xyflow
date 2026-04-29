"use client"

import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete"
import { javascript } from "@codemirror/lang-javascript"
import { EditorView, type ViewUpdate } from "@codemirror/view"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { FieldError } from "@workspace/ui/components/field"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover"
import CodeMirror from "@uiw/react-codemirror"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createExpressionCompletionSource } from "../../autocomplete"
import {
  buildExpressionInsertion,
  validateTemplateExpression,
} from "../../template"
import type { ExpressionCommitEvent, ExpressionVariableOption } from "../../types"
import { expressionEditorStyles } from "./expression-editor.styles"

type ExpressionCompletionSource = (
  context: CompletionContext
) => CompletionResult | null | Promise<CompletionResult | null>

export interface ExpressionEditorProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  onCommit: (nextValue: string, event: ExpressionCommitEvent) => void
  onLiveChange?: (nextValue: string) => void
}

export function ExpressionEditor({
  value,
  placeholder,
  variables,
  onCommit,
  onLiveChange,
}: ExpressionEditorProps) {
  const editorViewRef = useRef<EditorView | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Internal live value for validation display. The committed `value` prop is
  // only updated on commit, so validation must read from the live editor text.
  const [liveValue, setLiveValue] = useState(value)

  useEffect(() => {
    setLiveValue(value)
  }, [value])

  const commitRef = useRef<(event: ExpressionCommitEvent) => void>(() => {})
  useEffect(() => {
    commitRef.current = (event) => {
      const currentDoc = editorViewRef.current?.state.doc.toString()
      if (currentDoc !== undefined && currentDoc !== value) {
        onCommit(currentDoc, event)
      }
    }
  }, [onCommit, value])

  const groupedVariables = useMemo(
    () => groupVariablesBySection(variables),
    [variables]
  )
  const validation = useMemo(() => validateTemplateExpression(liveValue), [liveValue])
  const styles = expressionEditorStyles()
  const completionSource = useMemo<ExpressionCompletionSource>(
    () => createExpressionCompletionSource(variables),
    [variables]
  )

  // CodeMirror extensions are intentionally stable and read the latest commit
  // callback through a ref when editor events fire.
  const commitExtension = useMemo(
    () => [
      // eslint-disable-next-line react-hooks/refs
      EditorView.updateListener.of((vu: ViewUpdate) => {
        if (vu.focusChanged && !vu.view.hasFocus) {
          commitRef.current({ reason: "blur" })
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
    () => [
      javascript(),
      autocompletion({
        override: [completionSource],
        icons: false,
        tooltipClass: () => "cm-shadcn-autocomplete",
      }),
      EditorView.lineWrapping,
      commitExtension,
    ],
    [completionSource, commitExtension]
  )
  const basicSetup = useMemo(
    () => ({
      foldGutter: false,
      highlightActiveLine: false,
      lineNumbers: false,
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
        editorView.state.doc.sliceString(selection.to, selection.to + 2) === "}}"
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

  const handleCreateEditor = useCallback((nextEditorView: EditorView) => {
    editorViewRef.current = nextEditorView
  }, [])

  const handleChange = useCallback(
    (nextValue: string, viewUpdate: ViewUpdate) => {
      setLiveValue(nextValue)
      onLiveChange?.(nextValue)

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
        setPickerOpen(true)
      }
    },
    [onLiveChange, pickerOpen]
  )

  return (
    <div className={styles.root()}>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverAnchor asChild>
          <div className={styles.editorContainer()}>
            <CodeMirror
              value={value}
              placeholder={placeholder}
              minHeight="26px"
              basicSetup={basicSetup}
              extensions={extensions}
              onCreateEditor={handleCreateEditor}
              onChange={handleChange}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className={styles.popoverContent()}
          align="start"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          <Command>
            <CommandInput placeholder="Search variables..." />
            <CommandList>
              <CommandEmpty>No variables available.</CommandEmpty>
              {groupedVariables.map(([group, options]) => (
                <CommandGroup key={group} heading={group}>
                  {options.map((option) => (
                    <CommandItem
                      key={`${group}-${option.value}`}
                      value={`${option.label} ${option.description}`}
                      onSelect={() => insertVariable(option)}
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
        </PopoverContent>
      </Popover>

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
