"use client"

import { useMemo, useRef, useState } from "react"
import Tour, { type TourProps } from "@rc-component/tour"
import { getPlacements } from "@rc-component/tour/es/placements"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  XIcon,
} from "lucide-react"
import {
  WORKFLOW_EDITOR_TOUR,
  WorkflowEditor,
  builtinDefinitions,
  type WorkflowEditorAnchorElements,
  type WorkflowTourAnchor,
  type WorkflowTourStep,
} from "@flow/flow"
import { Button } from "@flow/ui/components/button"

import { ExampleFrame } from "./example-frame"
import { TourMedia } from "./tour-media"

type RcTourStep = NonNullable<TourProps["steps"]>[number]
const tourPopupClassName = "fixed w-max max-w-[calc(100vw-2rem)]"
// The canvas fills the editor, so there is no room "above" it: dock the panel
// inside its top edge, clear of the toolbar.
const CANVAS_PANEL_PLACEMENT = "canvasTop"
const CANVAS_PANEL_OFFSET_Y = 72
const PANEL_OVERFLOW = {
  adjustX: true,
  adjustY: true,
  shiftX: true,
  shiftY: true,
}
// rc-tour aligns without overflow handling, so panels near an edge would leave
// the viewport (and Chrome pauses offscreen autoplay clips). Flip, then shift.
const tourPlacements: TourProps["builtinPlacements"] = {
  ...Object.fromEntries(
    Object.entries(getPlacements()).map(([name, align]) => [
      name,
      { ...align, overflow: PANEL_OVERFLOW },
    ])
  ),
  [CANVAS_PANEL_PLACEMENT]: {
    points: ["tc", "tc"],
    offset: [0, CANVAS_PANEL_OFFSET_Y],
    overflow: PANEL_OVERFLOW,
  },
}

function resolveTourPlacement(step: WorkflowTourStep) {
  const isCanvasStep =
    step.anchor.type === "editor" && step.anchor.id === "canvas"
  // Custom keys are valid builtinPlacements but outside rc-tour's union type.
  return (
    isCanvasStep ? CANVAS_PANEL_PLACEMENT : step.placement
  ) as RcTourStep["placement"]
}

const workflowTourSteps: readonly WorkflowTourStep[] = WORKFLOW_EDITOR_TOUR
const tourPanelClassName =
  "rounded-lg border border-gray-200 bg-white p-4 text-gray-950 shadow-xl"

function resolveWorkflowTourAnchor(
  anchor: WorkflowTourAnchor,
  anchors: WorkflowEditorAnchorElements
) {
  if (anchor.type === "paletteItem") {
    return anchors.paletteItems?.[anchor.kind] ?? null
  }

  return anchors[anchor.id] ?? null
}

function renderTourPanel(
  step: Parameters<NonNullable<TourProps["renderPanel"]>>[0],
  current: number,
  mediaBaseUrl: string | undefined
) {
  const isFirstStep = current === 0
  const isLastStep = current === (step.total ?? 1) - 1
  const media =
    mediaBaseUrl === undefined ? undefined : workflowTourSteps[current]?.media

  return (
    <div
      className={
        media
          ? `w-[min(28rem,calc(100vw-2rem))] ${tourPanelClassName}`
          : `w-[min(20rem,calc(100vw-2rem))] ${tourPanelClassName}`
      }
    >
      {media && mediaBaseUrl !== undefined && (
        <TourMedia
          // Remount per clip so every step starts its loop from the beginning.
          key={media.src}
          media={media}
          baseUrl={mediaBaseUrl}
        />
      )}
      <div
        className={
          media
            ? "mt-3 flex items-start justify-between gap-4"
            : "flex items-start justify-between gap-4"
        }
      >
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

type TourAnchorsExampleProps = {
  /**
   * Where the host serves the recorded tour clips. Step media paths are
   * relative ("tour/..."); without a base URL the tour shows text only.
   */
  mediaBaseUrl?: string
}

export function TourAnchorsExample({ mediaBaseUrl }: TourAnchorsExampleProps) {
  const anchorRefs = useRef<WorkflowEditorAnchorElements>({})
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const tourSteps = useMemo(
    () =>
      WORKFLOW_EDITOR_TOUR.map((step) => ({
        className: tourPopupClassName,
        title: step.title,
        description: step.body,
        placement: resolveTourPlacement(step),
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
    <ExampleFrame>
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
      <WorkflowEditor
        definitions={builtinDefinitions}
        anchorRefs={anchorRefs}
      />
      <Tour
        open={open}
        current={current}
        steps={tourSteps}
        onChange={setCurrent}
        onClose={closeTour}
        onFinish={closeTour}
        builtinPlacements={tourPlacements}
        renderPanel={(step, current) =>
          renderTourPanel(step, current, mediaBaseUrl)
        }
        mask={{ color: "rgba(15, 23, 42, 0.32)" }}
        arrow={false}
        zIndex={80}
        gap={{ offset: 6, radius: 8 }}
        rootClassName="workflow-tour-example"
      />
    </ExampleFrame>
  )
}
