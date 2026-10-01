"use client"

import type { NodeProps } from "@xyflow/react"
import { Checkbox } from "@flow/ui/components/checkbox"
import { Field, FieldLabel } from "@flow/ui/components/field"

import { useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { SetterView } from "../setter-shared/setter-view"

export function JsonSetterNode({ id, data, selected }: NodeProps) {
  const { config } = useBaseNodeData(data)
  const { updateNodeConfig } = useNodeStoreData(id)
  const appendInputId = `${id}-append-input`

  return (
    <SetterView
      nodeId={id}
      data={data}
      selected={selected}
      kind="jsonSetter"
      fallbackTitle="JSON Setter"
      footer={
        <Field>
          <FieldLabel htmlFor={appendInputId}>Append input</FieldLabel>
          <div>
            <Checkbox
              id={appendInputId}
              isSelected={config.appendInput === true}
              onChange={(checked) => {
                updateNodeConfig(id, {
                  kind: "jsonSetter",
                  key: "appendInput",
                  value: checked === true,
                })
              }}
            />
          </div>
        </Field>
      }
    />
  )
}
