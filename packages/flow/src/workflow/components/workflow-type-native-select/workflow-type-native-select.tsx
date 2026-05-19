"use client"

import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Brackets, Type } from "lucide-react"
import { tv } from "tailwind-variants"

import {
  WORKFLOW_VARIABLE_TYPES,
  type WorkflowVariableType,
} from "../../types/variable-types"

interface WorkflowTypeNativeSelectProps {
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

const workflowTypeNativeSelectStyles = tv({
  slots: {
    root: "relative shrink-0",
    select: [
      "relative shrink-0",
      "[&_[data-slot=native-select]]:cursor-pointer",
      "[&_[data-slot=native-select]]:text-transparent",
      "[&_[data-slot=native-select]]:selection:bg-transparent",
      "[&_[data-slot=native-select]]:selection:text-transparent",
      "[&_[data-slot=native-select-icon]]:hidden",
      "[&_[data-slot=native-select-option]]:text-foreground",
    ],
    iconWrap:
      "pointer-events-none absolute inset-0 flex items-center justify-center text-foreground",
    icon: "",
  },
  variants: {
    size: {
      default: {
        root: "size-7",
        select: [
          "size-7",
          "[&_[data-slot=native-select]]:size-7",
          "[&_[data-slot=native-select]]:p-0",
        ],
        icon: "size-4",
      },
      sm: {
        root: "size-6",
        select: [
          "size-6",
          "[&_[data-slot=native-select]]:size-6",
          "[&_[data-slot=native-select]]:p-0",
        ],
        icon: "size-3.5",
      },
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export function WorkflowTypeNativeSelect({
  value,
  onChange,
  ariaLabel,
  allowedTypes = WORKFLOW_VARIABLE_TYPES,
  className,
  size = "default",
}: WorkflowTypeNativeSelectProps) {
  const styles = workflowTypeNativeSelectStyles({ size })
  const selectedType = TYPE_META[value]
  const SelectedIcon = selectedType.Icon

  return (
    <div className={styles.root({ className })}>
      <NativeSelect
        aria-label={ariaLabel}
        className={styles.select()}
        size={size}
        title={`${ariaLabel}: ${selectedType.label}`}
        value={value}
        onChange={(event) => {
          onChange(event.target.value as WorkflowVariableType)
        }}
      >
        {allowedTypes.map((type) => (
          <NativeSelectOption
            key={type}
            className="text-foreground"
            value={type}
          >
            {TYPE_META[type].label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <span className={styles.iconWrap()} aria-hidden="true">
        <SelectedIcon className={styles.icon()} />
      </span>
    </div>
  )
}
