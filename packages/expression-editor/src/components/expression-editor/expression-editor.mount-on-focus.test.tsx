// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { EditorView } from "@codemirror/view"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ExpressionVariableOption } from "../../types"
import { ExpressionEditor } from "./expression-editor"

const variables: ExpressionVariableOption[] = [
  {
    label: "price",
    value: "price",
    description: "From Calc",
    group: "Upstream",
  },
]

function renderEditor(
  props: Partial<Parameters<typeof ExpressionEditor>[0]> = {}
) {
  const onCommit = vi.fn()
  const result = render(
    <ExpressionEditor
      value="{{ price }} and {{ unknown }}"
      variables={variables}
      onCommit={onCommit}
      mountOnFocus
      {...props}
    />
  )
  return { ...result, onCommit }
}

function getEditorView(container: HTMLElement): EditorView {
  const dom = container.querySelector<HTMLElement>(".cm-editor")
  const view = dom ? EditorView.findFromDOM(dom) : null
  if (!view) {
    throw new Error("expected a mounted CodeMirror editor")
  }
  return view
}

afterEach(() => {
  cleanup()
})

describe("ExpressionEditor mountOnFocus", () => {
  it("renders a static preview instead of CodeMirror until activated", () => {
    const { container } = renderEditor()

    expect(container.querySelector(".cm-editor")).toBeNull()
    const preview = screen.getByRole("textbox")
    expect(preview.textContent).toBe("{{ price }} and {{ unknown }}")
  })

  it("highlights delimiters and known variables like the editor does", () => {
    const { container } = renderEditor()

    const known = container.querySelectorAll(".cm-expression-known-variable")
    expect(Array.from(known, (element) => element.textContent)).toEqual([
      "price",
    ])
    expect(container.querySelectorAll(".cm-expression-delimiter")).toHaveLength(
      4
    )
  })

  it("shows the placeholder while the value is empty", () => {
    renderEditor({ value: "", placeholder: "Type an expression" })

    expect(screen.getByRole("textbox").textContent).toBe("Type an expression")
  })

  it("keeps showing validation errors in preview mode", () => {
    renderEditor({ value: "{{ price" })

    expect(
      screen.getByText("Missing closing braces for expression.")
    ).toBeTruthy()
  })

  it("mounts and focuses CodeMirror when the preview is pressed", () => {
    const { container } = renderEditor()

    fireEvent.pointerDown(screen.getByRole("textbox"))

    const view = getEditorView(container)
    expect(view.state.doc.toString()).toBe("{{ price }} and {{ unknown }}")
    expect(view.hasFocus).toBe(true)
  })

  it("mounts CodeMirror when the preview receives keyboard focus", () => {
    const { container } = renderEditor()

    act(() => {
      screen.getByRole("textbox").focus()
    })

    expect(getEditorView(container).hasFocus).toBe(true)
  })

  it("commits on blur and returns to the preview", async () => {
    const { container, onCommit } = renderEditor({ value: "a" })
    fireEvent.pointerDown(screen.getByRole("textbox"))
    const view = getEditorView(container)

    act(() => {
      view.dispatch({ changes: { from: 1, insert: "b" } })
      view.contentDOM.blur()
    })

    // CodeMirror reports a lost focus a tick after the DOM event.
    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith("ab", { reason: "blur" })
    })
    expect(container.querySelector(".cm-editor")).toBeNull()
    expect(screen.getByRole("textbox").textContent).toBe("ab")
  })

  it("mounts CodeMirror right away without mountOnFocus", () => {
    const { container } = renderEditor({ mountOnFocus: false })

    expect(container.querySelector(".cm-editor")).not.toBeNull()
  })

  it("commits a pending edit when the editor unmounts while focused", () => {
    const { container, onCommit, unmount } = renderEditor({ value: "a" })
    fireEvent.pointerDown(screen.getByRole("textbox"))
    const view = getEditorView(container)

    act(() => {
      view.dispatch({ changes: { from: 1, insert: "b" } })
    })
    // A host can drop the field before CodeMirror reports the blur, e.g. a
    // canvas swapping a node for its compact card.
    unmount()

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("ab", { reason: "blur" })
  })

  it("does not commit the same text twice when blur is followed by unmount", async () => {
    const { container, onCommit, unmount } = renderEditor({ value: "a" })
    fireEvent.pointerDown(screen.getByRole("textbox"))
    const view = getEditorView(container)

    act(() => {
      view.dispatch({ changes: { from: 1, insert: "b" } })
      view.contentDOM.blur()
    })
    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledTimes(1)
    })
    unmount()

    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it("keeps the editor while the variable picker is open", async () => {
    const { container } = renderEditor({ value: "" })
    fireEvent.pointerDown(screen.getByRole("textbox"))
    const view = getEditorView(container)

    act(() => {
      view.dispatch({
        changes: { from: 0, insert: "{{}}" },
        selection: { anchor: 2 },
      })
    })

    expect(
      await screen.findByPlaceholderText("Search variables...")
    ).toBeTruthy()
    // Give CodeMirror's delayed blur report a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(container.querySelector(".cm-editor")).not.toBeNull()
  })

  it("commits a picked variable and keeps editing", async () => {
    const { container, onCommit } = renderEditor({ value: "" })
    fireEvent.pointerDown(screen.getByRole("textbox"))
    const view = getEditorView(container)

    act(() => {
      view.dispatch({
        changes: { from: 0, insert: "{{}}" },
        selection: { anchor: 2 },
      })
    })
    fireEvent.click(await screen.findByText("price"))

    expect(onCommit).toHaveBeenCalledWith(
      "{{ price }}",
      expect.objectContaining({ reason: "variable-insert" })
    )
    expect(container.querySelector(".cm-editor")).not.toBeNull()
  })
})
