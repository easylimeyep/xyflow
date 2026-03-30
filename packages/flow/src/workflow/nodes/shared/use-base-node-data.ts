import type { NodeProps } from "@xyflow/react"
import { useMemo } from "react"

import { asRecord, asText } from "./node-data-utils"

type BaseNodeData = {
  dataRecord: Record<string, unknown>
  label: string
  config: Record<string, unknown>
}

export function useBaseNodeData(data: NodeProps["data"]): BaseNodeData {
  return useMemo(() => {
    const dataRecord = asRecord(data)
    const label = asText(dataRecord.label)
    const config = asRecord(dataRecord.config)

    return { dataRecord, label, config }
  }, [data])
}
