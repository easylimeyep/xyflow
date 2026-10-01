"use client"

import type { ReactElement } from "react"

import { Kbd, KbdGroup } from "@flow/ui/components/kbd"
import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"

export interface SearchActionTooltipProps {
  /** What the control does, shown as the tooltip's text. */
  label: string
  /** Keys that do the same from the query field, e.g. `["Shift", "Enter"]`. */
  shortcut?: readonly string[]
  /** The single control the tooltip describes. */
  children: ReactElement
}

/** A hover/focus tooltip naming a find-bar control and its key binding. */
export function SearchActionTooltip({
  label,
  shortcut,
  children,
}: SearchActionTooltipProps) {
  return (
    <TooltipTrigger>
      {children}
      <Tooltip>
        {label}
        {shortcut ? (
          <KbdGroup>
            {shortcut.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
        ) : null}
      </Tooltip>
    </TooltipTrigger>
  )
}
