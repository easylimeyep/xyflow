"use client"

import { useState } from "react"
import { ExpandIcon } from "lucide-react"

import { WorkflowEditor, createInitialGraph } from "@workspace/flow"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { ExamplePreview } from "./example-preview"

const initialGraph = createInitialGraph({
  nodes: [
    {
      id: "demo-modal-inline-expression",
      kind: "inlineExpression",
      config: {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      },
    },
    {
      id: "demo-modal-extractor",
      kind: "extractor",
      label: "Email extractor",
      config: {
        tokenNumber: 1,
        extractExpression: "email",
        unlimited: false,
      },
    },
    {
      id: "demo-modal-evaluator",
      kind: "evaluator",
      label: "Has company domain",
      config: {
        conditions: [
          {
            id: "demo-modal-evaluator-condition",
            value: "{{ email }}",
            operator: "contains",
            targetValue: "@company.com",
          },
        ],
        logicalOperator: "and",
      },
    },
    {
      id: "demo-modal-result-true",
      kind: "result",
      label: "Qualified",
      config: {
        category: "true",
      },
    },
    {
      id: "demo-modal-result-false",
      kind: "result",
      label: "Needs review",
      config: {
        category: "false",
      },
    },
  ],
  edges: [
    {
      id: "demo-modal-edge-inline-to-extractor",
      source: "demo-modal-inline-expression",
      target: "demo-modal-extractor",
    },
    {
      id: "demo-modal-edge-extractor-to-evaluator",
      source: "demo-modal-extractor",
      target: "demo-modal-evaluator",
    },
    {
      id: "demo-modal-edge-evaluator-to-true",
      source: "demo-modal-evaluator",
      sourceHandle: "evaluator-true",
      target: "demo-modal-result-true",
    },
    {
      id: "demo-modal-edge-evaluator-to-false",
      source: "demo-modal-evaluator",
      sourceHandle: "evaluator-false",
      target: "demo-modal-result-false",
    },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-fullscreen-modal",
    name: "Workflow Fullscreen Modal Demo",
    metadata: { source: "docs-demo-fullscreen-modal" },
  },
})

const code = `import { useState } from "react"

import { WorkflowEditor, createInitialGraph } from "@workspace/flow"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

const initialGraph = createInitialGraph({
  nodes: [
    { id: "demo-modal-inline-expression", kind: "inlineExpression", config: { template: ["lead"], isRoot: true, repeatable: false } },
    { id: "demo-modal-extractor", kind: "extractor", label: "Email extractor", config: { tokenNumber: 1, extractExpression: "email", unlimited: false } },
    { id: "demo-modal-evaluator", kind: "evaluator", label: "Has company domain", config: { conditions: [{ id: "demo-modal-evaluator-condition", value: "{{ email }}", operator: "contains", targetValue: "@company.com" }], logicalOperator: "and" } },
    { id: "demo-modal-result-true", kind: "result", label: "Qualified", config: { category: "true" } },
    { id: "demo-modal-result-false", kind: "result", label: "Needs review", config: { category: "false" } },
  ],
  edges: [
    { id: "demo-modal-edge-inline-to-extractor", source: "demo-modal-inline-expression", target: "demo-modal-extractor" },
    { id: "demo-modal-edge-extractor-to-evaluator", source: "demo-modal-extractor", target: "demo-modal-evaluator" },
    { id: "demo-modal-edge-evaluator-to-true", source: "demo-modal-evaluator", sourceHandle: "evaluator-true", target: "demo-modal-result-true" },
    { id: "demo-modal-edge-evaluator-to-false", source: "demo-modal-evaluator", sourceHandle: "evaluator-false", target: "demo-modal-result-false" },
  ],
  viewport: { x: 40, y: 40, zoom: 0.8 },
  document: {
    id: "workflow-demo-fullscreen-modal",
    name: "Workflow Fullscreen Modal Demo",
    metadata: { source: "docs-demo-fullscreen-modal" },
  },
})

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open fullscreen workflow</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0"
        >
          <DialogTitle className="sr-only">Fullscreen workflow modal</DialogTitle>
          <DialogDescription className="sr-only">
            Entire workflow editor rendered inside a fullscreen dialog.
          </DialogDescription>

          <div className="flex h-full min-h-0 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-950">Lead qualification workflow</p>
                <p className="text-sm text-gray-600">The whole workflow editor is mounted inside the modal.</p>
              </div>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>

            <div className="min-h-0 flex-1">
              <WorkflowEditor initialGraph={initialGraph} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}`

export function FullscreenModalExample() {
  const [open, setOpen] = useState(false)

  return (
    <ExamplePreview
      title="Fullscreen modal workflow"
      description="Пример, где весь editor workflow открывается внутри full-screen модалки, а не рендерится прямо на странице."
      code={code}
    >
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc,transparent_55%),linear-gradient(180deg,#ffffff_0%,#f3f4f6_100%)] p-6">
        <div className="flex w-full max-w-2xl flex-col gap-6 rounded-[28px] border border-gray-200 bg-white/95 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              Modal-first workflow shell
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-gray-950">
              Open the editor as a fullscreen flow
            </h3>
            <p className="max-w-xl text-sm leading-6 text-gray-600">
              Подходит для сценария, где workflow должен жить в отдельном
              immersive-слое поверх списка, таблицы или dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setOpen(true)}>
              <ExpandIcon />
              Open fullscreen workflow
            </Button>
            <span className="text-sm text-gray-500">
              Toolbar, canvas, palette и config panel находятся внутри модалки.
            </span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            showCloseButton={false}
            className="top-0 left-0 h-svh w-screen max-w-none! translate-x-0 translate-y-0 rounded-none border-0 p-0"
          >
            <DialogTitle className="sr-only">
              Fullscreen workflow modal
            </DialogTitle>
            <DialogDescription className="sr-only">
              Entire workflow editor rendered inside a fullscreen dialog.
            </DialogDescription>

            <div className="flex h-full min-h-0 flex-col bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    Lead qualification workflow
                  </p>
                  <p className="text-sm text-gray-600">
                    Весь workflow editor живёт внутри full-screen модалки.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="min-h-0 flex-1">
                <WorkflowEditor initialGraph={initialGraph} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ExamplePreview>
  )
}
