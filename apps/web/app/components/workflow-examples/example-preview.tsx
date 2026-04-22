"use client"

import type { ReactNode } from "react"
import { ChevronDownIcon, Code2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type ExamplePreviewProps = {
  title: string
  description: string
  code: string
  children: ReactNode
}

export function ExamplePreview({
  title,
  description,
  code,
  children,
}: ExamplePreviewProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <Collapsible className="group flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={`Toggle ${title} code example`}
                    >
                      <Code2Icon />
                      <ChevronDownIcon className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  Show code example
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <CollapsibleContent>
            <pre className="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
              <code>{code}</code>
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex min-h-0 min-h-screen flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {children}
      </div>
    </section>
  )
}
