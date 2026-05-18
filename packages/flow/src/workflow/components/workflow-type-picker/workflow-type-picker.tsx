"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { Brackets, Check, Type } from "lucide-react"
import { useMemo, useState } from "react"

import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../types/variable-types"

interface WorkflowTypePickerProps {
  value: WorkflowVariableType
  onChange: (value: WorkflowVariableType) => void
  ariaLabel: string
  className?: string
  size?: "sm" | "default"
}

const TYPE_META = {
  string: {
    label: "string",
    Icon: Type,
  },
  array: {
    label: "array",
    Icon: Brackets,
  },
} satisfies Record<WorkflowVariableType, { label: string; Icon: typeof Type }>

export function WorkflowTypePicker({
  value,
  onChange,
  ariaLabel,
  className,
  size = "default",
}: WorkflowTypePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedType = TYPE_META[value]
  const SelectedIcon = selectedType.Icon
  const buttonSize = size === "sm" ? "icon-sm" : "icon"
  const optionClassName = useMemo(
    () =>
      cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs",
        "text-popover-foreground outline-none hover:bg-muted focus-visible:bg-muted"
      ),
    []
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={buttonSize}
          aria-label={ariaLabel}
          title={`${ariaLabel}: ${selectedType.label}`}
          className={className}
        >
          <SelectedIcon aria-hidden="true" />
          <span className="sr-only">{selectedType.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-32 gap-1 p-1.5">
        {WORKFLOW_VARIABLE_TYPES.map((type) => {
          const option = TYPE_META[type]
          const OptionIcon = option.Icon
          const selected = type === value

          return (
            <button
              key={type}
              type="button"
              role="option"
              aria-selected={selected}
              className={optionClassName}
              onClick={() => {
                onChange(type)
                setOpen(false)
              }}
            >
              <OptionIcon aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="min-w-0 flex-1">{option.label}</span>
              {selected ? (
                <Check aria-hidden="true" className="h-3 w-3" />
              ) : null}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
