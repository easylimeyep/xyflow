// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { nodeShellStyles } from "../../styles/components/nodes"
import { builtinDefinitions } from "../node-registry/builtin-definitions"
import { WorkflowStoreProvider } from "../store"

vi.mock("@xyflow/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@xyflow/react")>()),
  Handle: () => null,
}))

/** What a pointer can press inside a node to edit or act, not to drag it. */
const CONTROL_SELECTOR = [
  "input",
  "textarea",
  "button",
  "[role=combobox]",
  "[role=checkbox]",
  "[contenteditable]",
].join(", ")

const viewDefinitions = builtinDefinitions.filter(
  (definition) => definition.view !== undefined
)

function renderNode(definition: (typeof viewDefinitions)[number]) {
  const View = definition.view!
  const props = {
    id: `drag-area-${definition.kind}`,
    type: definition.kind,
    data: {
      kind: definition.kind,
      label: definition.title,
      config: definition.buildDefaultConfig(),
    },
    selected: false,
    dragging: false,
    zIndex: 1,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as NodeProps
  return render(<View {...props} />, { wrapper: WorkflowStoreProvider })
}

/**
 * The header's action area opts out as a whole (badges, validation, header
 * accessories); this change covers the body below the header.
 */
const HEADER_ACTIONS_CLASS = nodeShellStyles().headerActions()

function isBlockedByBody(element: Element): boolean {
  const optOut = element.closest(".nodrag")
  return optOut !== null && optOut.className !== HEADER_ACTIONS_CLASS
}

function describeElement(element: Element): string {
  const name =
    element.getAttribute("aria-label") ??
    element.getAttribute("placeholder") ??
    element.textContent?.trim().slice(0, 30)
  return `<${element.tagName.toLowerCase()}> ${name ?? ""}`.trim()
}

afterEach(cleanup)

describe("node drag area", () => {
  it("covers every built-in node with a view", () => {
    expect(viewDefinitions.length).toBeGreaterThan(0)
  })

  const cases = viewDefinitions.map(
    (definition) => [definition.kind, definition] as const
  )

  it.each(cases)(
    "%s: every control opts out of the node drag",
    (_, definition) => {
      const { container } = renderNode(definition)
      const draggableControls = [
        ...container.querySelectorAll(CONTROL_SELECTOR),
      ].filter((control) => !control.closest(".nodrag"))
      expect(draggableControls.map(describeElement)).toEqual([])
    }
  )

  it.each(cases)("%s: field labels drag the node", (_, definition) => {
    const { container } = renderNode(definition)
    // A label that wraps its own control — a checkbox, or a select's hidden
    // native <select> — is part of that control.
    const blockedLabels = [...container.querySelectorAll("label")].filter(
      (label) => !label.querySelector("input, select") && isBlockedByBody(label)
    )
    expect(blockedLabels.map(describeElement)).toEqual([])
  })
})
