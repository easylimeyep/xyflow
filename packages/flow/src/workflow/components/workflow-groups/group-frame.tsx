"use client"

import { Button } from "@flow/ui/components/button"
import { NodeResizer, type NodeProps } from "@xyflow/react"
import { LayoutGrid } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

import {
  groupFrameStyles,
  groupToolbarStyles,
} from "../../../styles/components/canvas"
import type { GroupCanvasNode } from "../../groups/group-canvas-nodes"
import { normalizeGroupColor } from "../../groups/group-colors"
import { GROUP_MIN_HEIGHT, GROUP_MIN_WIDTH } from "../../groups/group-geometry"
import { useWorkflowStore } from "../../store"
import { ActionTooltip } from "../action-tooltip"
import { GroupCollapseButton } from "./group-collapse-button"
import { GroupColorPicker } from "./group-color-picker"
import { GroupContextMenu } from "./group-context-menu"
import { GroupRenameInput } from "./group-rename-input"
import { describeGroup } from "./group-labels"
import { useSelectGroupOnly } from "./use-select-group"
import { useGroupSearchStatus } from "./use-group-search-status"

/**
 * An expanded group: a tinted frame drawn beneath nodes and edges. Only its
 * header bar takes the pointer — it drags, selects, renames, and holds the group's
 * actions; the body lets everything through to the canvas.
 */
export function GroupFrame({ data, selected }: NodeProps<GroupCanvasNode>) {
  const { groupId, label, color, memberIds, collapsed, editable } = data
  const [isRenaming, setIsRenaming] = useState(false)
  const renameGroup = useWorkflowStore((state) => state.renameGroup)
  const recolorGroup = useWorkflowStore((state) => state.recolorGroup)
  const arrangeGroup = useWorkflowStore((state) => state.arrangeGroup)
  const [isArranging, setIsArranging] = useState(false)
  const selectGroupOnly = useSelectGroupOnly()
  const searchState = useGroupSearchStatus(groupId)
  const styles = groupFrameStyles({
    color: normalizeGroupColor(color),
    selected,
    editable,
    searchState,
  })
  const toolbar = groupToolbarStyles()

  const onHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter") {
      event.preventDefault()
      selectGroupOnly(groupId)
    } else if (event.key === "F2" && editable) {
      event.preventDefault()
      setIsRenaming(true)
    }
  }

  return (
    <div className={styles.root()} data-testid="workflow-group-frame">
      {editable ? (
        <NodeResizer
          isVisible={selected}
          minWidth={GROUP_MIN_WIDTH}
          minHeight={GROUP_MIN_HEIGHT}
          lineClassName={styles.resizeLine()}
          handleClassName={styles.resizeHandle()}
        />
      ) : null}
      <GroupContextMenu
        groupId={groupId}
        selected={selected}
        enabled={editable}
      >
        <div className={styles.header()}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the bar is the group's drag handle and holds its own buttons, so it cannot be a <button>; Enter selects and F2 renames, like xyflow's focusable `role="group"` nodes. */}
          <div
            className={styles.bar()}
            role="group"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above.
            tabIndex={0}
            aria-label={describeGroup(label, memberIds.length)}
            onKeyDown={onHeaderKeyDown}
            onDoubleClick={(event) => {
              if (!editable) return
              event.stopPropagation()
              setIsRenaming(true)
            }}
          >
            {isRenaming ? (
              <GroupRenameInput
                label={label}
                className={styles.renameInput()}
                onCommit={(next) => {
                  renameGroup(groupId, next)
                  setIsRenaming(false)
                }}
                onCancel={() => setIsRenaming(false)}
              />
            ) : (
              <span
                className={styles.title()}
                data-testid="workflow-group-title"
                data-search-state={
                  searchState === "none" ? undefined : searchState
                }
              >
                {label}
              </span>
            )}
            <span className={styles.count()} aria-hidden="true">
              {memberIds.length}
            </span>
            <div className={styles.actions()}>
              <div className={toolbar.dock()}>
                {editable ? (
                  <>
                    <GroupColorPicker
                      color={color}
                      onChange={(next) => recolorGroup(groupId, next)}
                    />
                    <ActionTooltip label="Arrange">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={toolbar.button()}
                        aria-label="Arrange"
                        isDisabled={memberIds.length === 0 || isArranging}
                        onPress={() => {
                          setIsArranging(true)
                          void arrangeGroup(groupId).finally(() =>
                            setIsArranging(false)
                          )
                        }}
                      >
                        <LayoutGrid className={toolbar.icon()} />
                      </Button>
                    </ActionTooltip>
                    <span className={toolbar.divider()} aria-hidden="true" />
                  </>
                ) : null}
                <GroupCollapseButton groupId={groupId} collapsed={collapsed} />
              </div>
            </div>
          </div>
        </div>
      </GroupContextMenu>
      <div className={styles.inner()} />
    </div>
  )
}
