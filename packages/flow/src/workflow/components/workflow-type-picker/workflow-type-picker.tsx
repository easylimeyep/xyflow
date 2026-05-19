"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Brackets, Check, Type } from "lucide-react"
import { useState } from "react"
import { tv } from "tailwind-variants"

import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../types/variable-types"

interface WorkflowTypePickerProps {
  value: WorkflowVariableType
  onChange: (value: WorkflowVariableType) => void
  ariaLabel: string
  allowedTypes?: WorkflowVariableType[]
  className?: string
  size?: "sm" | "default"
}

const TYPE_META = {
  value: {
    label: "value",
    Icon: Type,
  },
  array: {
    label: "array",
    Icon: Brackets,
  },
} satisfies Record<WorkflowVariableType, { label: string; Icon: typeof Type }>

const workflowTypePickerStyles = tv({
  slots: {
    trigger: "",
    content: "w-32 gap-1 p-1.5",
    option:
      "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-popover-foreground outline-none hover:bg-muted focus-visible:bg-muted",
    optionIcon: "h-3.5 w-3.5",
    optionLabel: "min-w-0 flex-1",
    checkIcon: "h-3 w-3",
  },
})

export function WorkflowTypePicker({
  value,
  onChange,
  ariaLabel,
  allowedTypes = WORKFLOW_VARIABLE_TYPES,
  className,
  size = "default",
}: WorkflowTypePickerProps) {
  const styles = workflowTypePickerStyles()
  const [open, setOpen] = useState(false)
  const selectedType = TYPE_META[value]
  const SelectedIcon = selectedType.Icon
  const buttonSize = size === "sm" ? "icon-sm" : "icon"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={buttonSize}
          aria-label={ariaLabel}
          title={`${ariaLabel}: ${selectedType.label}`}
          className={styles.trigger({ className })}
        >
          <SelectedIcon aria-hidden="true" />
          <span className="sr-only">{selectedType.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={styles.content()}>
        {allowedTypes.map((type) => {
          const option = TYPE_META[type]
          const OptionIcon = option.Icon
          const selected = type === value

          return (
            <button
              key={type}
              type="button"
              role="option"
              aria-selected={selected}
              className={styles.option()}
              onClick={() => {
                onChange(type)
                setOpen(false)
              }}
            >
              <OptionIcon aria-hidden="true" className={styles.optionIcon()} />
              <span className={styles.optionLabel()}>{option.label}</span>
              {selected ? (
                <Check aria-hidden="true" className={styles.checkIcon()} />
              ) : null}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
