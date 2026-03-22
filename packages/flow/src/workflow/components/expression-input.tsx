"use client"

import { autocompletion } from "@codemirror/autocomplete"
import { javascript } from "@codemirror/lang-javascript"
import type { EditorView } from "@codemirror/view"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import CodeMirror from "@uiw/react-codemirror"
import { BracesIcon, PlusIcon } from "lucide-react"
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
      onChange(`${value}${insertion}`)
      return
    }

    const selection = editorView.state.selection.main
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: insertion,
      },
      selection: {
        anchor: selection.from + insertion.length,
      },
    })
    editorView.focus()
    setPickerOpen(false)
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-end">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1">
              <PlusIcon className="size-3" />
              Insert variable
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
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
      </div>

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
          onChange={(nextValue) => onChange(nextValue)}
        />
      </div>

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
