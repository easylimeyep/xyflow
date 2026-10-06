"use client"

import { Button } from "@flow/ui/components/button"
import { Popover, PopoverTrigger } from "@flow/ui/components/popover"

import {
  groupColorPickerStyles,
  groupToolbarStyles,
} from "../../../styles/components/canvas"
import { normalizeGroupColor } from "../../groups/group-colors"
import {
  WORKFLOW_GROUP_COLORS,
  type WorkflowGroup,
  type WorkflowGroupColor,
} from "../../types"
import { ActionTooltip } from "../action-tooltip"

interface GroupColorPickerProps {
  color: WorkflowGroup["color"]
  onChange: (color: WorkflowGroupColor) => void
}

/** A swatch for each color token; the current one is ringed. */
export function GroupColorPicker({ color, onChange }: GroupColorPickerProps) {
  const current = normalizeGroupColor(color)
  const styles = groupColorPickerStyles()
  const toolbar = groupToolbarStyles()

  return (
    <PopoverTrigger>
      <ActionTooltip label="Group color">
        <Button
          size="icon"
          variant="ghost"
          className={toolbar.button()}
          aria-label="Group color"
        >
          <span className={toolbar.swatchDot()} aria-hidden="true" />
        </Button>
      </ActionTooltip>
      <Popover placement="bottom end" className="w-auto">
        <div
          className={styles.root()}
          role="radiogroup"
          aria-label="Group color"
        >
          <div className={styles.swatches()}>
            {WORKFLOW_GROUP_COLORS.map((token) => (
              <button
                key={token}
                type="button"
                role="radio"
                aria-checked={token === current}
                aria-label={token}
                className={groupColorPickerStyles({
                  color: token,
                  active: token === current,
                }).swatch()}
                onClick={() => onChange(token)}
              />
            ))}
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  )
}
