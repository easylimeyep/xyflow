"use client"

import type { NodeProps } from "@xyflow/react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { resultNodeStyles } from "../../../../styles/components/nodes"
import {
  selectVisibleValidationMessagesForNode,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../../store"
import { NodeShell } from "../../node-shell/node-shell"
import { useBaseNodeData } from "../../shared/use-base-node-data"

export function ResultNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)
  const updateNodeConfig = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfig
  )
  const nodeValidationMessages = useWorkflowStore((state: WorkflowStoreState) =>
    selectVisibleValidationMessagesForNode(state, id)
  )
  const styles = resultNodeStyles()
  const category =
    typeof config.category === "string" ? config.category : "true"

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle=""
      selected={selected}
      outputs={[]}
      validationMessages={nodeValidationMessages}
    >
      <div className={styles.root()}>
        <div className={styles.fieldGroup()}>
          <label className={styles.label()}>Category</label>
          <Select
            aria-label="Category"
            selectedKey={category}
            onSelectionChange={(key) =>
              updateNodeConfig(id, {
                kind: "result",
                key: "category",
                value: key as "true" | "false",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id="true">true</SelectItem>
              <SelectItem id="false">false</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </NodeShell>
  )
}
