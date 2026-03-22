import { beforeEach, describe, expect, it } from "vitest"

import { useWorkflowStore } from "./store"
import type { WorkflowNode } from "./types"

function resetStore(): void {
  useWorkflowStore.setState(useWorkflowStore.getInitialState(), true)
}

describe("workflow store", () => {
  beforeEach(() => {
    resetStore()
  })

  it("adds node and updates history", () => {
    const before = useWorkflowStore.getState().history.present.nodes.length
    useWorkflowStore.getState().addNode("customInput", { x: 50, y: 50 })
    const state = useWorkflowStore.getState()

    expect(state.history.present.nodes.length).toBe(before + 1)
    expect(state.history.past.length).toBeGreaterThan(0)
  })

  it("supports undo and redo", () => {
    const store = useWorkflowStore.getState()
    const before = store.history.present.nodes.length

    store.addNode("code", { x: 120, y: 100 })
    useWorkflowStore.getState().undo()
    expect(useWorkflowStore.getState().history.present.nodes.length).toBe(before)

    useWorkflowStore.getState().redo()
    expect(useWorkflowStore.getState().history.present.nodes.length).toBe(before + 1)
  })

  it("imports workflow from domain json", () => {
    const exportDomain = useWorkflowStore.getState().exportDomain()
    const imported = useWorkflowStore.getState().importFromJson(exportDomain)

    expect(imported).toBe(true)
    expect(useWorkflowStore.getState().lastError).toBeNull()
  })

  it("sets error for invalid import json", () => {
    const imported = useWorkflowStore.getState().importFromJson("{\"bad\":true}")

    expect(imported).toBe(false)
    expect(useWorkflowStore.getState().lastError).toContain("nodes")
  })

  it("rejects invalid connections and keeps graph stable", () => {
    const state = useWorkflowStore.getState()
    const trigger = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "trigger"
    )
    const transform = state.history.present.nodes.find(
      (node: WorkflowNode) => node.data.kind === "transform"
    )
    if (!trigger || !transform) {
      throw new Error("fixture nodes not found")
    }

    const edgeCount = state.history.present.edges.length
    state.onConnect({ source: transform.id, target: trigger.id })
    const nextState = useWorkflowStore.getState()

    expect(nextState.history.present.edges.length).toBe(edgeCount)
    expect(nextState.lastError).toContain("cannot connect")
  })
})
