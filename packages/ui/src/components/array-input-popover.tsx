"use client"

import * as React from "react"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"

import { Badge } from "@flow/ui/components/badge"
import { Button } from "@flow/ui/components/button"
import { Input } from "@flow/ui/components/input"
import { Popover, PopoverTrigger } from "@flow/ui/components/popover"
import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"
import { cn } from "@flow/ui/lib/utils"

const DEFAULT_PREVIEW_LIMIT = 3

/** Everything a custom row editor needs to edit one entry. */
interface ArrayInputEntryProps {
  value: string
  index: number
  /** Accessible name for the row, e.g. "Left array value 1". */
  ariaLabel: string
  onChange: (nextValue: string) => void
}

/** How the closed trigger previews one entry. */
interface ArrayInputEntryMeta {
  variant?: "literal" | "variable"
  /** Shown as a warning icon on the badge, with this text as its tooltip. */
  warning?: string
}

interface ArrayInputPopoverProps {
  open: boolean
  values: string[]
  label: string
  placeholder: string
  previewLimit?: number
  className?: string
  popoverClassName?: string
  /** Replaces the plain text input of every row. */
  renderEntry?: (entry: ArrayInputEntryProps) => React.ReactNode
  getEntryMeta?: (value: string) => ArrayInputEntryMeta
  onOpenChange: (open: boolean) => void
  onValuesChange: (values: string[]) => void
}

function ArrayInputPopover({
  open,
  values,
  label,
  placeholder,
  previewLimit = DEFAULT_PREVIEW_LIMIT,
  className,
  popoverClassName,
  renderEntry,
  getEntryMeta,
  onOpenChange,
  onValuesChange,
}: ArrayInputPopoverProps) {
  const previewValues = values.filter((value) => value.trim() !== "")
  const visiblePreviewValues = previewValues.slice(0, previewLimit)
  const hiddenPreviewCount = Math.max(
    0,
    previewValues.length - visiblePreviewValues.length
  )

  const updateArrayEntry = (index: number, nextValue: string) => {
    onValuesChange(
      values.map((entry, entryIndex) =>
        entryIndex === index ? nextValue : entry
      )
    )
  }

  const addArrayEntry = () => {
    onValuesChange([...values, ""])
  }

  const removeArrayEntry = (index: number) => {
    onValuesChange(values.filter((_, entryIndex) => entryIndex !== index))
  }

  return (
    <PopoverTrigger isOpen={open} onOpenChange={onOpenChange}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "w-full min-w-0 justify-between overflow-hidden px-2",
          className
        )}
        aria-label={`Edit ${label} array values`}
      >
        {visiblePreviewValues.length > 0 ? (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {visiblePreviewValues.map((value, index) => (
                <PreviewBadge
                  key={`${value}-${index}`}
                  value={value}
                  meta={getEntryMeta?.(value)}
                />
              ))}
            </span>
            {hiddenPreviewCount > 0 ? (
              <Badge
                variant="secondary"
                className="h-4 shrink-0 px-1.5 text-[0.625rem]"
              >
                +{hiddenPreviewCount}
              </Badge>
            ) : null}
          </>
        ) : (
          <span className="min-w-0 truncate text-muted-foreground">
            {placeholder}
          </span>
        )}
      </Button>
      <Popover
        placement="bottom start"
        className={cn("w-56 gap-1 p-2", popoverClassName)}
      >
        <div className="space-y-1">
          {values.map((entry, index) => (
            <div
              key={index}
              className="group/operand-row relative flex items-center gap-1"
            >
              {renderEntry ? (
                <div className="min-w-0 flex-1">
                  {renderEntry({
                    value: entry,
                    index,
                    ariaLabel: `${label} array value ${index + 1}`,
                    onChange: (nextValue) => updateArrayEntry(index, nextValue),
                  })}
                </div>
              ) : (
                <Input
                  aria-label={`${label} array value ${index + 1}`}
                  className="min-w-0 flex-1"
                  value={entry}
                  onChange={(event) =>
                    updateArrayEntry(index, event.target.value)
                  }
                />
              )}
              <button
                type="button"
                aria-label={`Delete ${label} array value ${index + 1}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                onClick={() => removeArrayEntry(index)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 w-full text-[11px]"
            onPress={addArrayEntry}
          >
            <Plus data-icon="inline-start" />
            Add value
          </Button>
        </div>
      </Popover>
    </PopoverTrigger>
  )
}

interface PreviewBadgeProps {
  value: string
  meta?: ArrayInputEntryMeta
}

function PreviewBadge({ value, meta }: PreviewBadgeProps) {
  const isVariable = meta?.variant === "variable"
  const badge = (
    <Badge
      variant={isVariable ? "secondary" : "outline"}
      data-entry-variant={isVariable ? "variable" : "literal"}
      className={cn(
        "h-4 max-w-[4.5rem] min-w-0 px-1.5 text-[0.625rem]",
        isVariable && "font-mono text-primary",
        meta?.warning &&
          "border-yellow-500/80 bg-yellow-200 text-yellow-900 dark:text-yellow-200"
      )}
      title={meta?.warning ? undefined : value}
    >
      {meta?.warning ? (
        <AlertTriangle
          aria-label={meta.warning}
          className="size-2.5 shrink-0"
        />
      ) : null}
      <span className="min-w-0 truncate">{value}</span>
    </Badge>
  )

  if (!meta?.warning) {
    return badge
  }

  return (
    <TooltipTrigger>
      {badge}
      <Tooltip>{meta.warning}</Tooltip>
    </TooltipTrigger>
  )
}

export {
  ArrayInputPopover,
  type ArrayInputEntryMeta,
  type ArrayInputEntryProps,
  type ArrayInputPopoverProps,
}
