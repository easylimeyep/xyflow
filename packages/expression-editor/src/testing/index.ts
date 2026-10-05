import { EditorView } from "@codemirror/view"

/**
 * Test helpers for suites that render the expression editor from outside this
 * package. jsdom cannot type into CodeMirror's contenteditable, so these drive
 * the live view directly. Callers wrap them in `act` like any other update.
 */

function getExpressionEditorView(root: ParentNode): EditorView {
  const editor = root.querySelector<HTMLElement>(".cm-editor")
  const view = editor ? EditorView.findFromDOM(editor) : null
  if (!view) {
    throw new Error("No mounted expression editor found")
  }
  return view
}

/** Appends `text` to the mounted editor's value, as if typed at its end. */
export function appendExpressionText(root: ParentNode, text: string): void {
  const view = getExpressionEditorView(root)
  const end = view.state.doc.length
  view.dispatch({
    changes: { from: end, insert: text },
    selection: { anchor: end + text.length },
  })
}

/** Moves focus out of the mounted editor. */
export function blurExpressionEditor(root: ParentNode): void {
  getExpressionEditorView(root).contentDOM.blur()
}
