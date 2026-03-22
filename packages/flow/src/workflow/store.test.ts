import { beforeEach, describe, expect, it } from "vitest"

import { createWorkflowStore } from "./store"
import type { WorkflowNode } from "./types"

let store: ReturnType<typeof createWorkflowStore>

describe("workflow store", () => {
  beforeEach(() => {
    store = createWorkflowStore()
  })

  it("adds node and updates history", () => {
    const before = store.getState().history.present.nodes.length
    store.getState().addNode("customInput", { x: 50, y: 50 })
    const state = store.getState()

    expect(state.history.present.nodes.length).toBe(before + 1)
    expect(state.history.past.length).toBeGreaterThan(0)
  })

  it("supports undo and redo", () => {
    const workflowStore = store.getState()
    const before = workflowStore.history.present.nodes.length

    workflowStore.addNode("code", { x: 120, y: 100 })
    store.getState().undo()
    expect(store.getState().history.present.nodes.length).toBe(before)

    store.getState().redo()
    expect(store.getState().history.present.nodes.length).toBe(before + 1)
  })

  it("imports workflow from domain json", () => {
    const exportDomain = store.getState().exportDomain()
    const imported = store.getState().importFromJson(exportDomain)

    expect(imported).toBe(true)
    expect(store.getState().lastError).toBeNull()
  })

  it("sets error for invalid import json", () => {
    const imported = store.getState().importFromJson("{\"bad\":true}")

    expect(imported).toBe(false)
    expect(store.getState().lastError).toContain("nodes")
  })

  it("rejects invalid connections and keeps graph stable", () => {
    const state = store.getState()
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
    const nextState = store.getState()

    expect(nextState.history.present.edges.length).toBe(edgeCount)
    expect(nextState.lastError).toContain("cannot connect")
  })
})
