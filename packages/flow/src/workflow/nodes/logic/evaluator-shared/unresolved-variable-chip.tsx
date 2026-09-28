"use client"

import { Badge } from "@flow/ui/components/badge"
import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"
import { AlertTriangle } from "lucide-react"

import { unresolvedVariableMessage } from "./operands"

interface UnresolvedVariableChipProps {
  variableName: string
}

/** Warns, in the top-right corner of an operand input, about a dangling reference. */
export function UnresolvedVariableChip({
  variableName,
}: UnresolvedVariableChipProps) {
  return (
    <div className="absolute top-1 right-1 z-10">
      <TooltipTrigger>
        <Badge
          variant="outline"
          className="z-10 h-5 border-yellow-500/80 bg-yellow-200 px-1.5 text-[10px] text-yellow-900 dark:text-yellow-200"
        >
          <AlertTriangle className="mr-1 h-3 w-3" />
          Unknown
        </Badge>
        <Tooltip>{unresolvedVariableMessage(variableName)}</Tooltip>
      </TooltipTrigger>
    </div>
  )
}
