"use client"

import { useMemo, useRef, useState } from "react"
import Tour, { type TourProps } from "@rc-component/tour"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  XIcon,
} from "lucide-react"
import {
  WORKFLOW_EDITOR_TOUR,
  WorkflowEditor,
  type WorkflowEditorAnchorElements,
  type WorkflowTourAnchor,
} from "@workspace/flow"
import { Button } from "@workspace/ui/components/button"

import { ExamplePreview } from "./example-preview"

type RcTourStep = NonNullable<TourProps["steps"]>[number]
const tourPopupClassName = "fixed w-max max-w-[calc(100vw-2rem)]"

const code = `import { useMemo, useRef, useState } from "react"
import Tour, { type TourProps } from "@rc-component/tour"
import {
  WORKFLOW_EDITOR_TOUR,
  WorkflowEditor,
  type WorkflowEditorAnchorElements,
  type WorkflowTourAnchor,
} from "@workspace/flow"

type RcTourStep = NonNullable<TourProps["steps"]>[number]

function resolveWorkflowTourAnchor(
  anchor: WorkflowTourAnchor,
  anchors: WorkflowEditorAnchorElements
) {
  if (anchor.type === "paletteItem") {
    return anchors.paletteItems?.[anchor.kind] ?? null
  }

  return anchors[anchor.id] ?? null
}

export function Example() {
  const anchorRefs = useRef<WorkflowEditorAnchorElements>({})
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const tourSteps = useMemo(
    () =>
      WORKFLOW_EDITOR_TOUR.map((step) => ({
        className: "fixed w-max max-w-[calc(100vw-2rem)]",
        title: step.title,
        description: step.body,
        placement: step.placement,
        target: (() =>
          resolveWorkflowTourAnchor(
            step.anchor,
            anchorRefs.current
          )) as RcTourStep["target"],
      })) satisfies TourProps["steps"],
    []
  )

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCurrent(0)
          setOpen(true)
        }}
      >
        Start tour
      </button>
      <WorkflowEditor anchorRefs={anchorRefs} />
      <Tour
        open={open}
        current={current}
        steps={tourSteps}
        onChange={setCurrent}
        onClose={() => setOpen(false)}
        onFinish={() => setOpen(false)}
      />
    </>
  )
}`

function resolveWorkflowTourAnchor(
  anchor: WorkflowTourAnchor,
  anchors: WorkflowEditorAnchorElements
) {
  if (anchor.type === "paletteItem") {
    return anchors.paletteItems?.[anchor.kind] ?? null
  }

  return anchors[anchor.id] ?? null
}

const renderTourPanel: NonNullable<TourProps["renderPanel"]> = (
  step,
  current
) => {
  const isFirstStep = current === 0
  const isLastStep = current === (step.total ?? 1) - 1

  return (
    <div className="w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-4 text-gray-950 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{step.title}</div>
          <div className="mt-2 text-sm leading-5 text-gray-600">
            {step.description}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close workflow tour"
          onClick={step.onClose}
        >
          <XIcon />
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-gray-500">
          {current + 1} / {step.total}
        </span>
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={step.onPrev}
            >
              <ChevronLeftIcon />
              Prev
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={isLastStep ? step.onFinish : step.onNext}
          >
            {isLastStep ? "Finish" : "Next"}
            {!isLastStep && <ChevronRightIcon />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TourAnchorsExample() {
  const anchorRefs = useRef<WorkflowEditorAnchorElements>({})
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const tourSteps = useMemo(
    () =>
      WORKFLOW_EDITOR_TOUR.map((step) => ({
        className: tourPopupClassName,
        title: step.title,
        description: step.body,
        placement: step.placement,
        target: (() =>
          resolveWorkflowTourAnchor(
            step.anchor,
            anchorRefs.current
          )) as RcTourStep["target"],
      })) satisfies TourProps["steps"],
    []
  )

  const closeTour = () => {
    setOpen(false)
    setCurrent(0)
  }

  return (
    <ExamplePreview
      title="rc-tour workflow tour"
      description="Живой пример @rc-component/tour поверх WORKFLOW_EDITOR_TOUR и lazy anchorRefs target callbacks."
      code={code}
    >
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
        <div className="text-xs text-gray-600">
          Default workflow tour rendered by the app, not by the flow package.
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setCurrent(0)
            setOpen(true)
          }}
        >
          <PlayIcon data-icon="inline-start" />
          Start tour
        </Button>
      </div>
      <WorkflowEditor anchorRefs={anchorRefs} />
      <Tour
        open={open}
        current={current}
        steps={tourSteps}
        onChange={setCurrent}
        onClose={closeTour}
        onFinish={closeTour}
        renderPanel={renderTourPanel}
        mask={{ color: "rgba(15, 23, 42, 0.32)" }}
        arrow={false}
        zIndex={80}
        gap={{ offset: 6, radius: 8 }}
        rootClassName="workflow-tour-example"
      />
    </ExamplePreview>
  )
}
