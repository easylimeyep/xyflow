// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"

import {
  RuntimeObservationProvider,
  useEdgeRuntimeState,
  useNodeRuntimeState,
  useRuntimeMode,
} from "./runtime-overlay-context"
import type { WorkflowRuntimeOverlay } from "../types"

function NodeProbe({ nodeId }: { nodeId: string }) {
  const runtime = useNodeRuntimeState(nodeId)
  return (
    <div data-testid={`node-${nodeId}`}>
      {runtime ? runtime.status : "none"}
    </div>
  )
}

function EdgeProbe({ edgeId }: { edgeId: string }) {
  const { traversed, active } = useEdgeRuntimeState(edgeId)
  return (
    <div data-testid={`edge-${edgeId}`}>
      {traversed ? "traversed" : "-"}/{active ? "active" : "-"}
    </div>
  )
}

function ModeProbe() {
  return <div data-testid="mode">{useRuntimeMode()}</div>
}

function renderWithOverlay(
  overlay: WorkflowRuntimeOverlay,
  children: ReactNode
) {
  return render(
    <RuntimeObservationProvider mode="observe" overlay={overlay}>
      {children}
    </RuntimeObservationProvider>
  )
}

describe("runtime observation context", () => {
  afterEach(() => {
    cleanup()
  })

  it("resolves nodes absent from the overlay to no runtime state", () => {
    const overlay: WorkflowRuntimeOverlay = {
      nodes: { present: { status: "running" } },
      activeEdgeIds: [],
      traversedEdgeIds: [],
    }

    renderWithOverlay(
      overlay,
      <>
        <NodeProbe nodeId="present" />
        <NodeProbe nodeId="absent" />
      </>
    )

    expect(screen.getByTestId("node-present").textContent).toBe("running")
    expect(screen.getByTestId("node-absent").textContent).toBe("none")
  })

  it("reports edges as both traversed and active when listed in both", () => {
    const overlay: WorkflowRuntimeOverlay = {
      nodes: {},
      activeEdgeIds: ["loop-edge"],
      traversedEdgeIds: ["loop-edge", "done-edge"],
    }

    renderWithOverlay(
      overlay,
      <>
        <EdgeProbe edgeId="loop-edge" />
        <EdgeProbe edgeId="done-edge" />
        <EdgeProbe edgeId="untouched-edge" />
      </>
    )

    expect(screen.getByTestId("edge-loop-edge").textContent).toBe(
      "traversed/active"
    )
    expect(screen.getByTestId("edge-done-edge").textContent).toBe("traversed/-")
    expect(screen.getByTestId("edge-untouched-edge").textContent).toBe("-/-")
  })

  it("defaults to edit mode with neutral state when no provider is mounted", () => {
    render(
      <>
        <ModeProbe />
        <NodeProbe nodeId="anything" />
        <EdgeProbe edgeId="anything" />
      </>
    )

    expect(screen.getByTestId("mode").textContent).toBe("edit")
    expect(screen.getByTestId("node-anything").textContent).toBe("none")
    expect(screen.getByTestId("edge-anything").textContent).toBe("-/-")
  })

  it("exposes the provided mode", () => {
    renderWithOverlay(
      { nodes: {}, activeEdgeIds: [], traversedEdgeIds: [] },
      <ModeProbe />
    )

    expect(screen.getByTestId("mode").textContent).toBe("observe")
  })
})
