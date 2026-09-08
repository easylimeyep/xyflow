"use client"

import type { NodeProps } from "@xyflow/react"
import { Label } from "@flow/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flow/ui/components/select"

import { jsonEvaluatorNodeStyles } from "../../../../styles/components/nodes"
import type { EvaluatorMatchType } from "../../../types"
import { useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { EvaluatorView } from "../evaluator-shared"
import { jsonEvaluator } from "./definition"
import {
  DEFAULT_MATCH_TYPE,
  isEvaluatorMatchType,
  MATCH_TYPE_OPTIONS,
} from "./match-type"

const styles = jsonEvaluatorNodeStyles()

export function JsonEvaluatorNode({ id, data, selected }: NodeProps) {
  const { config } = useBaseNodeData(data)
  const { updateNodeConfig } = useNodeStoreData(id)

  const matchType = isEvaluatorMatchType(config.matchType)
    ? config.matchType
    : DEFAULT_MATCH_TYPE

  return (
    <EvaluatorView
      nodeId={id}
      data={data}
      selected={selected}
      kind="jsonEvaluator"
      fallbackTitle="JSON Evaluator"
      outputs={jsonEvaluator.outputs}
      footer={
        <div className={styles.matchTypeField()}>
          <Label className={styles.matchTypeLabel()}>Match type</Label>
          <Select
            aria-label="Match type"
            selectedKey={matchType}
            onSelectionChange={(key) => {
              updateNodeConfig(id, {
                kind: "jsonEvaluator",
                key: "matchType",
                value: key as EvaluatorMatchType,
              })
            }}
          >
            <SelectTrigger size="sm" className={styles.matchTypeSelect()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.id} id={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    />
  )
}
