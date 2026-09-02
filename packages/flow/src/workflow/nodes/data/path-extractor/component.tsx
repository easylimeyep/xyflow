"use client"

import type { NodeProps } from "@xyflow/react"
import { Input } from "@flow/ui/components/input"
import { Label } from "@flow/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flow/ui/components/select"
import { useCallback, useRef, useState } from "react"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import type { PathExtractorOutputType } from "../../../types/types"
import { NodeShell } from "../../node-shell/node-shell"
import { asText, useBaseNodeData, useVariableIdentifierField } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { PATH_EXTRACTOR_OUTPUT_TYPE_OPTIONS } from "./definition"

function readOutputType(value: unknown): PathExtractorOutputType {
  return value === "string" ||
    value === "arrayValue" ||
    value === "arrayObject"
    ? value
    : "value"
}

export function PathExtractorNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Path Extractor"
  const { nodeValidationMessages, updateNodeConfig } = useNodeStoreData(id)
  const styles = setVariableNodeStyles()

  const variableLabel = asText(config.variableLabel).trim()
  const pathFromStore = asText(config.path)
  const outputType = readOutputType(config.outputType)

  const variableLabelField = useVariableIdentifierField({
    value: variableLabel,
    allowEmpty: true,
    onCommit: (nextLabel) => {
      updateNodeConfig(id, {
        kind: "pathExtractor",
        key: "variableLabel",
        value: nextLabel,
      })
    },
  })

  const [draftPath, setDraftPath] = useState(pathFromStore)
  const [isPathFocused, setIsPathFocused] = useState(false)
  const shownPath = isPathFocused ? draftPath : pathFromStore

  const commitPath = useCallback(() => {
    const nextPath = draftPath.trim()
    if (nextPath === pathFromStore) {
      return
    }
    updateNodeConfig(id, {
      kind: "pathExtractor",
      key: "path",
      value: nextPath,
    })
  }, [draftPath, id, pathFromStore, updateNodeConfig])

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle=""
      selected={selected}
      validationMessages={nodeValidationMessages}
    >
      <div className={styles.root()}>
        <div className={styles.fieldGroup()}>
          <Label className={styles.label()}>Label</Label>
          <Input
            ref={variableLabelField.inputRef}
            value={variableLabelField.shownValue}
            placeholder="myVar"
            onFocus={variableLabelField.onFocus}
            onChange={(event) =>
              variableLabelField.onChange(event.target.value)
            }
            onBlur={variableLabelField.onBlur}
            onKeyDown={variableLabelField.onKeyDown}
          />
          {variableLabelField.errorText ? (
            <p className={styles.errorText()}>{variableLabelField.errorText}</p>
          ) : null}
        </div>

        <div className={styles.fieldGroup()}>
          <Label className={styles.label()}>Path</Label>
          <Input
            value={shownPath}
            placeholder="user.address.city"
            onFocus={() => {
              setDraftPath(pathFromStore)
              setIsPathFocused(true)
            }}
            onChange={(event) => setDraftPath(event.target.value)}
            onBlur={() => {
              commitPath()
              setIsPathFocused(false)
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              commitPath()
              setIsPathFocused(false)
              event.currentTarget.blur()
            }}
          />
        </div>

        <div className={styles.fieldGroup()}>
          <Label className={styles.label()}>Expected out</Label>
          <Select
            aria-label="Expected out"
            selectedKey={outputType}
            onSelectionChange={(key) => {
              updateNodeConfig(id, {
                kind: "pathExtractor",
                key: "outputType",
                value: key as PathExtractorOutputType,
              })
            }}
          >
            <SelectTrigger aria-label="Expected out" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PATH_EXTRACTOR_OUTPUT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} id={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </NodeShell>
  )
}
