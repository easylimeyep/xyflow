"use client"

import type { NodeProps } from "@xyflow/react"

import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"

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
          <NativeSelect
            value={category}
            onChange={(e) =>
              updateNodeConfig(id, {
                kind: "result",
                key: "category",
                value: e.target.value as "true" | "false",
              })
            }
          >
            <NativeSelectOption value="true">true</NativeSelectOption>
            <NativeSelectOption value="false">false</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
    </NodeShell>
  )
}
