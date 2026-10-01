"use client"

import type { ReactElement } from "react"

import { Kbd, KbdGroup } from "@flow/ui/components/kbd"
import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"

export interface ActionTooltipProps {
  /** What the control does, shown as the tooltip's text. */
  label: string
  /** Keys that trigger the same action, e.g. `["Shift", "Enter"]`. */
  shortcut?: readonly string[]
  /** The single control the tooltip describes. */
  children: ReactElement
}

/** A hover/focus tooltip naming an icon control and its key binding. */
export function ActionTooltip({
  label,
  shortcut,
  children,
}: ActionTooltipProps) {
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
