"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

const DEFAULT_PREVIEW_LIMIT = 3

interface ArrayInputPopoverProps {
  open: boolean
  values: string[]
  label: string
  placeholder: string
  previewLimit?: number
  className?: string
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
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
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
                  <Badge
                    key={`${value}-${index}`}
                    variant="outline"
                    className="h-4 max-w-[4.5rem] min-w-0 px-1.5 text-[0.625rem]"
                    title={value}
                  >
                    <span className="min-w-0 truncate">{value}</span>
                  </Badge>
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
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-1 p-2">
        <div className="space-y-1">
          {values.map((entry, index) => (
            <div
              key={index}
              className="group/operand-row relative flex items-center gap-1"
            >
              <Input
                aria-label={`${label} array value ${index + 1}`}
                className="min-w-0 flex-1"
                value={entry}
                onChange={(event) =>
                  updateArrayEntry(index, event.target.value)
                }
              />
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
            onClick={addArrayEntry}
          >
            <Plus data-icon="inline-start" />
            Add value
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ArrayInputPopover, type ArrayInputPopoverProps }
