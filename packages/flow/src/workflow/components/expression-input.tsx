"use client"

import { autocompletion } from "@codemirror/autocomplete"
import { javascript } from "@codemirror/lang-javascript"
import type { EditorView, ViewUpdate } from "@codemirror/view"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Popover, PopoverAnchor, PopoverContent } from "@workspace/ui/components/popover"
import CodeMirror from "@uiw/react-codemirror"
import { BracesIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { createExpressionCompletionSource } from "../expression/autocomplete"
import { buildExpressionInsertion, validateTemplateExpression } from "../expression/template"
import type { ExpressionVariableOption } from "../types"

interface ExpressionInputProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  onChange: (nextValue: string) => void
}

export function ExpressionInput({
  value,
  placeholder,
  variables,
  onChange,
}: ExpressionInputProps) {
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const groupedVariables = useMemo(() => groupVariablesBySection(variables), [variables])
  const validation = useMemo(() => validateTemplateExpression(value), [value])
  const extensions = useMemo(
    () => [
      javascript(),
      autocompletion({
        override: [createExpressionCompletionSource(variables)],
        icons: false,
        tooltipClass: () => "cm-shadcn-autocomplete",
      }),
    ],
    [variables]
  )

  const insertVariable = (expressionValue: string) => {
    const insertion = buildExpressionInsertion(expressionValue)
    if (!editorView) {
      const endsWithWrappedPlaceholder = value.endsWith("{{}}")
      const replaceTypedTrigger = value.endsWith("{{")
      const nextValue = endsWithWrappedPlaceholder
        ? `${value.slice(0, Math.max(0, value.length - 4))}${insertion}`
        : replaceTypedTrigger
          ? `${value.slice(0, Math.max(0, value.length - 2))}${insertion}`
          : `${value}${insertion}`
      onChange(nextValue)
      setPickerOpen(false)
      return
    }

    const selection = editorView.state.selection.main
    const docText = editorView.state.doc.toString()
    const hasTypedTrigger =
      selection.empty &&
      selection.from >= 2 &&
      editorView.state.doc.sliceString(selection.from - 2, selection.from) === "{{"
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
    editorView.focus()
    setPickerOpen(false)
  }

  const handleChange = (nextValue: string, viewUpdate: ViewUpdate) => {
    onChange(nextValue)

    if (pickerOpen) {
      return
    }

    const cursor = viewUpdate.state.selection.main.head
    const justTypedTrigger = nextValue.slice(Math.max(0, cursor - 2), cursor) === "{{"
    if (justTypedTrigger) {
      setPickerOpen(true)
    }
  }

  return (
    <div className="space-y-1">
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverAnchor asChild>
          <div className="overflow-hidden rounded-md border border-input bg-background">
            <CodeMirror
              value={value}
              placeholder={placeholder}
              minHeight="110px"
              basicSetup={{
                foldGutter: false,
                highlightActiveLine: false,
                lineNumbers: false,
              }}
              extensions={extensions}
              onCreateEditor={setEditorView}
              onChange={handleChange}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-96 p-0"
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
                      onSelect={() => insertVariable(option.value)}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-mono text-[11px]">{option.label}</span>
                        <span className="truncate text-[10px] text-muted-foreground">
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

      {!validation.valid ? (
        <div className="flex items-start gap-1 text-[11px] text-destructive">
          <BracesIcon className="mt-0.5 size-3 shrink-0" />
          <span>
            {validation.errors[0]?.message}
            {validation.errors.length > 1 ? ` (+${validation.errors.length - 1} more)` : ""}
          </span>
        </div>
      ) : null}
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
