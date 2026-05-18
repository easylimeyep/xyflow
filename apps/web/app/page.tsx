"use client"

import { BaseExample } from "@/app/components/workflow-examples/base-example"
import { BackendTransformExample } from "@/app/components/workflow-examples/backend-transform-example"
import { CustomOperatorsExample } from "@/app/components/workflow-examples/custom-operators-example"
import { DefaultGraphExample } from "@/app/components/workflow-examples/default-graph-example"
import { ElkGraphExample } from "@/app/components/workflow-examples/elk-graph-example"
import { FullscreenModalExample } from "@/app/components/workflow-examples/fullscreen-modal-example"
import { LargeElkGraphExample } from "@/app/components/workflow-examples/large-elk-graph-example"
import { TourAnchorsExample } from "@/app/components/workflow-examples/tour-anchors-example"
import {
  GlobalValidationExample,
  ValidationExample,
} from "@/app/components/workflow-examples/validation-example"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export default function Page() {
  return (
    <div className="min-h-svh bg-gray-100 p-6">
      <Tabs
        defaultValue="base"
        className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[1600px]"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-950">
              Workflow editor examples
            </h1>
            <p className="text-sm text-gray-600">
              Переключайся между базовым использованием и сценарием с{" "}
              <code className="rounded bg-gray-200 px-1 py-0.5 text-xs text-gray-900">
                initialGraph
              </code>
              , ELK layout и кастомными boolean-операторами.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="base">base</TabsTrigger>
            <TabsTrigger value="with-default-graph">
              with default graph
            </TabsTrigger>
            <TabsTrigger value="with-elk-graph">with elk graph</TabsTrigger>
            <TabsTrigger value="with-large-elk-graph">
              with large elk graph
            </TabsTrigger>
            <TabsTrigger value="with-custom-operators">
              with custom operators
            </TabsTrigger>
            <TabsTrigger value="with-backend-transform">
              with backend transform
            </TabsTrigger>
            <TabsTrigger value="with-tour-anchors">
              with tour anchors
            </TabsTrigger>
            <TabsTrigger value="with-validation">with validation</TabsTrigger>
            <TabsTrigger value="with-global-validation">
              global validation
            </TabsTrigger>
            <TabsTrigger value="with-fullscreen-modal">
              with fullscreen modal
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="base"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <BaseExample />
        </TabsContent>

        <TabsContent
          value="with-default-graph"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <DefaultGraphExample />
        </TabsContent>

        <TabsContent
          value="with-elk-graph"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <ElkGraphExample />
        </TabsContent>

        <TabsContent
          value="with-large-elk-graph"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <LargeElkGraphExample />
        </TabsContent>

        <TabsContent
          value="with-custom-operators"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <CustomOperatorsExample />
        </TabsContent>

        <TabsContent
          value="with-backend-transform"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <BackendTransformExample />
        </TabsContent>

        <TabsContent
          value="with-tour-anchors"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TourAnchorsExample />
        </TabsContent>

        <TabsContent
          value="with-validation"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <ValidationExample />
        </TabsContent>

        <TabsContent
          value="with-global-validation"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <GlobalValidationExample />
        </TabsContent>

        <TabsContent
          value="with-fullscreen-modal"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <FullscreenModalExample />
        </TabsContent>
      </Tabs>
    </div>
  )
}
