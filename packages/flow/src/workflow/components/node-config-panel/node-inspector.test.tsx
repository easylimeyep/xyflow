// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { NodeInspector } from "./node-inspector"
import { RuntimeObservationProvider } from "../../runtime"
import type { NodeRuntimeState, WorkflowRuntimeOverlay } from "../../types"

function renderInspector(nodeId: string, state?: NodeRuntimeState) {
  const overlay: WorkflowRuntimeOverlay = {
    nodes: state ? { [nodeId]: state } : {},
    activeEdgeIds: [],
    traversedEdgeIds: [],
  }

  return render(
    <RuntimeObservationProvider mode="observe" overlay={overlay}>
      <NodeInspector nodeId={nodeId} nodeTitle="Evaluator" />
    </RuntimeObservationProvider>
  )
}

describe("NodeInspector", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders an empty state when the selected node has no runtime state", () => {
    renderInspector("node-1")

    expect(screen.getByTestId("node-inspector-empty")).toBeTruthy()
    expect(screen.queryByTestId("node-inspector-input")).toBeNull()
    expect(screen.queryByTestId("node-inspector-output")).toBeNull()
  })

  it("renders input, output, and error for a node with runtime state", () => {
    renderInspector("node-1", {
      status: "failed",
      input: { leadScore: 42 },
      output: { qualified: true },
      error: "threshold not met",
    })

    expect(screen.getByTestId("inspector-status").textContent).toContain(
      "failed"
    )
    expect(screen.getByTestId("node-inspector-input").textContent).toContain(
      "leadScore"
    )
    expect(screen.getByTestId("node-inspector-output").textContent).toContain(
      "qualified"
    )
    expect(screen.getByTestId("node-inspector-error").textContent).toBe(
      "threshold not met"
    )
  })

  it("exposes no editable field while observing", () => {
    const { container } = renderInspector("node-1", {
      status: "done",
      output: { value: 1 },
    })

    expect(container.querySelectorAll("input")).toHaveLength(0)
    expect(container.querySelectorAll("textarea")).toHaveLength(0)
  })

  it("caps oversized payloads instead of rendering them whole", () => {
    const bigOutput = { blob: "x".repeat(9000) }
    renderInspector("node-1", { status: "done", output: bigOutput })

    const output = screen.getByTestId("node-inspector-output").textContent ?? ""
    expect(output).toContain("truncated")
    expect(output.length).toBeLessThan(9000)
  })
})
