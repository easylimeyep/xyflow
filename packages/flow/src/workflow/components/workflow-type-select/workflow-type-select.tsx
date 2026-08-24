"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@flow/ui/components/select"
import { Brackets, Type } from "lucide-react"
import { tv } from "tailwind-variants"

import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../types/variable-types"

interface WorkflowTypeSelectProps {
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

const workflowTypeSelectStyles = tv({
  slots: {
    root: "shrink-0",
    trigger: [
      "shrink-0 justify-center gap-0 p-0 text-foreground",
      // Hide SelectTrigger's trailing chevron (its last svg child).
      "[&>svg:last-child]:hidden",
    ],
    icon: "",
  },
  variants: {
    size: {
      default: {
        root: "size-7",
        trigger: "size-7",
        icon: "size-4",
      },
      sm: {
        root: "size-6",
        trigger: "size-6",
        icon: "size-3.5",
      },
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export function WorkflowTypeSelect({
  value,
  onChange,
  ariaLabel,
  allowedTypes = WORKFLOW_VARIABLE_TYPES,
  className,
  size = "default",
}: WorkflowTypeSelectProps) {
  const styles = workflowTypeSelectStyles({ size })
  const selectedType = TYPE_META[value]
  const SelectedIcon = selectedType.Icon

  return (
    <Select
      aria-label={ariaLabel}
      className={styles.root({ className })}
      selectedKey={value}
      onSelectionChange={(key) => {
        onChange(key as WorkflowVariableType)
      }}
    >
      <SelectTrigger
        ref={(node: HTMLButtonElement | null) => {
          if (node) {
            node.title = `${ariaLabel}: ${selectedType.label}`
          }
        }}
        aria-label={ariaLabel}
        className={styles.trigger()}
        size={size}
      >
        <SelectedIcon className={styles.icon()} aria-hidden="true" />
      </SelectTrigger>
      <SelectContent>
        {allowedTypes.map((type) => (
          <SelectItem key={type} id={type}>
            {TYPE_META[type].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
