import { domainToInternal } from "../converters/converters"
import { toDomainDTO } from "../domain-dto/domain-dto"
import { asRecord } from "../utils/utils"
import type { DomainWorkflowDTO, WorkflowGraphState } from "../../types/types"

export interface ParseResult<T> {
  success: boolean
  value?: T
  error?: string
}

export function parseDomainGraphJson(rawJson: string): ParseResult<DomainWorkflowDTO> {
  try {
    const parsed: unknown = JSON.parse(rawJson)
    if (!asRecord(parsed)) {
      return {
        success: false,
        error: "JSON root must be an object.",
      }
    }

    const domainDTO = toDomainDTO(parsed)
    if (!domainDTO.success) {
      return {
        success: false,
        error: domainDTO.error ?? "Workflow JSON must match domain workflow schema.",
      }
    }

    return {
      success: true,
      value: domainDTO.value,
    }
  } catch {
    return {
      success: false,
      error: "Invalid JSON payload.",
    }
  }
}

export function parseInternalGraphJson(rawJson: string): ParseResult<WorkflowGraphState> {
  const domainDTO = parseDomainGraphJson(rawJson)
  if (!domainDTO.success || !domainDTO.value) {
    return {
      success: false,
      error: domainDTO.error,
    }
  }

  return {
    success: true,
    value: domainToInternal(domainDTO.value),
  }
}

export function isValidDomainDto(value: unknown): value is DomainWorkflowDTO {
  const result = toDomainDTO(value)
  return result.success
}
