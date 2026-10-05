"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { CircleAlert } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

import { groupCardStyles } from "../../../styles/components/canvas"
import {
  GROUP_CARD_SOURCE_HANDLE,
  GROUP_CARD_TARGET_HANDLE,
} from "../../groups/group-canvas-edges"
import type { GroupCanvasNode } from "../../groups/group-canvas-nodes"
import { normalizeGroupColor } from "../../groups/group-colors"
import { useAggregateRuntimeStatus, useRuntimeMode } from "../../runtime"
import { selectNodeHasVisibleValidation, useWorkflowStore } from "../../store"
import { GroupCollapseButton } from "./group-collapse-button"
import { GroupContextMenu } from "./group-context-menu"
import { describeGroup } from "./group-labels"
import { useGroupSearchStatus } from "./use-group-search-status"
import { useSelectGroupOnly } from "./use-select-group"

/**
 * A collapsed group: one card standing in for its hidden members. Edges that
 * cross the group boundary attach to its decorative handles; it summarizes
 * the members' validation errors, and in observe mode their runtime status.
 */
export function GroupCard({ data, selected }: NodeProps<GroupCanvasNode>) {
  const { groupId, label, color, memberIds, editable } = data
  const isObserving = useRuntimeMode() === "observe"
  const hasError = useWorkflowStore((state) =>
    memberIds.some((nodeId) => selectNodeHasVisibleValidation(state, nodeId))
  )
  const runtimeStatus = useAggregateRuntimeStatus(memberIds)
  const searchState = useGroupSearchStatus(groupId)
  const selectGroupOnly = useSelectGroupOnly()
  const [hasFocus, setHasFocus] = useState(false)
  const styles = groupCardStyles({
    color: normalizeGroupColor(color),
    selected: selected || hasFocus,
    hasError,
    runtimeStatus: isObserving ? (runtimeStatus ?? "none") : "none",
    searchState,
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && event.key === "Enter") {
      event.preventDefault()
      selectGroupOnly(groupId)
    }
  }

  return (
    <GroupContextMenu groupId={groupId} selected={selected} enabled={editable}>
      <div
        className={styles.root()}
        role="group"
        tabIndex={0}
        aria-label={describeGroup(label, memberIds.length, { collapsed: true })}
        data-testid="workflow-group-card"
        onKeyDown={onKeyDown}
        onFocus={(event) => setHasFocus(event.target === event.currentTarget)}
        onBlur={() => setHasFocus(false)}
      >
        <Handle
          type="target"
          position={Position.Left}
          id={GROUP_CARD_TARGET_HANDLE}
          isConnectable={false}
          className={styles.handle()}
        />
        <span
          className={styles.status()}
          role={isObserving && runtimeStatus ? "img" : undefined}
          aria-label={
            isObserving && runtimeStatus
              ? `Status: ${runtimeStatus}`
              : undefined
          }
        />
        <span
          className={styles.title()}
          data-testid="workflow-group-title"
          data-search-state={searchState === "none" ? undefined : searchState}
        >
          {label}
        </span>
        {hasError ? (
          <CircleAlert
            className={styles.error()}
            role="img"
            aria-label="A node in this group has errors"
          />
        ) : null}
        <span className={styles.count()} data-testid="workflow-group-count">
          {memberIds.length}
        </span>
        <div className={styles.actions()}>
          <GroupCollapseButton groupId={groupId} collapsed />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id={GROUP_CARD_SOURCE_HANDLE}
          isConnectable={false}
          className={styles.handle()}
        />
      </div>
    </GroupContextMenu>
  )
}
