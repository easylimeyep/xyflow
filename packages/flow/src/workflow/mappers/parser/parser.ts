import { domainToInternal } from "../converters/converters"
import { toDomainDTO } from "../domain-dto/domain-dto"
import { asRecord } from "../utils/utils"
import type { DomainWorkflowDTO, WorkflowGraphState } from "../../types/types"

export interface ParseResult<T> {
  success: boolean
  value?: T
  error?: string
}

export function parseInternalGraphJson(rawJson: string): ParseResult<WorkflowGraphState> {
  try {
    const parsed: unknown = JSON.parse(rawJson)
    if (!asRecord(parsed)) {
      return {
        success: false,
        error: "JSON root must be an object.",
      }
    }

    const domainDTO = toDomainDTO(parsed)
    if (!domainDTO) {
      return {
        success: false,
        error: "Workflow JSON must match domain workflow schema.",
      }
    }

    return {
      success: true,
      value: domainToInternal(domainDTO),
    }
  } catch {
    return {
      success: false,
      error: "Invalid JSON payload.",
    }
  }
}

export function isValidDomainDto(value: unknown): value is DomainWorkflowDTO {
  return toDomainDTO(value) !== null
}
