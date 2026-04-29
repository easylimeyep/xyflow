// @vitest-environment jsdom

import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import { allDefinitions, nodeRegistry, WORKFLOW_NODE_KINDS, type NodeKind } from "./registry"

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("../nodes/output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

describe("registry smoke tests", () => {
  it("allDefinitions and nodeRegistry have matching entries", () => {
    const definitionKinds = allDefinitions.map((d) => d.kind).sort()
    const registryKinds = Object.keys(nodeRegistry).sort()

    expect(definitionKinds).toEqual(registryKinds)
  })

  it("WORKFLOW_NODE_KINDS matches registry keys", () => {
    const registryKinds = Object.keys(nodeRegistry).sort()
    const sortedKinds = [...WORKFLOW_NODE_KINDS].sort()

    expect(sortedKinds).toEqual(registryKinds)
  })

  it.each(WORKFLOW_NODE_KINDS)(
    "node kind '%s' has valid definition fields",
    (kind) => {
      const definition = nodeRegistry[kind as NodeKind]

      expect(definition).toBeDefined()
      expect(definition.kind).toBe(kind)
      expect(typeof definition.title).toBe("string")
      expect(definition.title.length).toBeGreaterThan(0)
      expect(typeof definition.description).toBe("string")
      expect(definition.icon).toBeDefined()
      expect(["control", "logic", "data", "io"]).toContain(definition.category)
      expect(Array.isArray(definition.fields)).toBe(true)
      expect(Array.isArray(definition.outputPaths)).toBe(true)
      expect(Array.isArray(definition.allowedTargets)).toBe(true)
      expect(typeof definition.buildDefaultConfig).toBe("function")
    }
  )

  it.each(WORKFLOW_NODE_KINDS)(
    "node kind '%s' builds valid default config",
    (kind) => {
      const definition = nodeRegistry[kind as NodeKind]
      const config = definition.buildDefaultConfig()

      expect(config).toBeDefined()
      expect(typeof config).toBe("object")
      expect(config).not.toBeNull()
    }
  )

  it.each(
    WORKFLOW_NODE_KINDS
  )(
    "node definition '%s' renders via DefaultNodeRenderer without client bindings",
    (kind) => {
      const definition = nodeRegistry[kind as NodeKind]

      const { container } = render(
        <DefaultNodeRenderer
          id={`test-${kind}`}
          type={kind}
          data={{
            kind,
            label: definition.title,
            config: definition.buildDefaultConfig(),
          }}
          selected={false}
          dragging={false}
          zIndex={1}
          selectable
          deletable
          draggable
          isConnectable
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          definition={definition}
        />
      )

      expect(container.textContent).toContain(definition.title)
    }
  )

  it("pure node definitions do not carry client component bindings", () => {
    for (const definition of allDefinitions) {
      expect("component" in definition).toBe(false)
    }
  })

  it("all allowedTargets reference valid node kinds", () => {
    const validKinds = new Set(WORKFLOW_NODE_KINDS)

    for (const definition of allDefinitions) {
      for (const target of definition.allowedTargets) {
        expect(validKinds.has(target as NodeKind)).toBe(true)
      }
    }
  })
})
