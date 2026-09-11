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
import {
  resolveSelectedOptionValue,
  useBaseNodeData,
  useNodeSelectOptions,
} from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { EvaluatorView } from "../evaluator-shared"
import { jsonEvaluator } from "./definition"
import { DEFAULT_MATCH_TYPE, MATCH_TYPE_OPTIONS } from "./match-type"

const styles = jsonEvaluatorNodeStyles()

export function JsonEvaluatorNode({ id, data, selected }: NodeProps) {
  const { config } = useBaseNodeData(data)
  const { updateNodeConfig } = useNodeStoreData(id)

  const matchTypeOptions = useNodeSelectOptions(
    jsonEvaluator.kind,
    "matchType",
    MATCH_TYPE_OPTIONS
  )
  const matchType = resolveSelectedOptionValue(
    matchTypeOptions,
    config.matchType,
    DEFAULT_MATCH_TYPE
  )
  // A host whose option request failed hands over an empty list. Show what the
  // node holds, muted and unopenable, rather than an editable select that can
  // only take the value away.
  const hasMatchTypeOptions = matchTypeOptions.length > 0

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
            isDisabled={!hasMatchTypeOptions}
            placeholder={hasMatchTypeOptions ? undefined : matchType}
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
              {matchTypeOptions.map((option) => (
                <SelectItem key={option.value} id={option.value}>
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
