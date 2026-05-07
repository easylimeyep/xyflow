// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useRef, useState } from "react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import type { ExpressionVariableOption } from "../../types"
import { ExpressionEditor } from "./expression-editor"

interface MockSelectionMain {
  head: number
  from: number
  to: number
  empty: boolean
}

interface MockEditorState {
  doc: {
    toString: () => string
    sliceString: (from: number, to: number) => string
  }
  selection: {
    main: MockSelectionMain
  }
}

interface MockEditorView {
  state: MockEditorState
  hasFocus: boolean
  dispatch: (transaction: {
    changes?: { from: number; to: number; insert: string }
    selection?: { anchor: number }
  }) => void
  focus: () => void
  dom: {
    blur: () => void
  }
}

interface MockViewUpdate {
  focusChanged: boolean
  view: MockEditorView
}

interface MockUpdateListenerExtension {
  __mockType: "updateListener"
  callback: (update: MockViewUpdate) => void
}

interface MockDomEventHandlersExtension {
  __mockType: "domEventHandlers"
  handlers: {
    keydown?: (event: KeyboardEvent, view: MockEditorView) => boolean | void
  }
}

interface MockAutocompleteExtension {
  __mockType: "autocompletion"
}

interface MockLineWrappingExtension {
  __mockType: "lineWrapping"
}

function flattenExtensions(extensions: unknown): unknown[] {
  if (Array.isArray(extensions)) {
    return extensions.flatMap(flattenExtensions)
  }
  return extensions === undefined ? [] : [extensions]
}

function isMockUpdateListenerExtension(
  extension: unknown
): extension is MockUpdateListenerExtension {
  return (
    typeof extension === "object" &&
    extension !== null &&
    "__mockType" in extension &&
    (extension as { __mockType?: string }).__mockType === "updateListener"
  )
}

function isMockDomEventHandlersExtension(
  extension: unknown
): extension is MockDomEventHandlersExtension {
  return (
    typeof extension === "object" &&
    extension !== null &&
    "__mockType" in extension &&
    (extension as { __mockType?: string }).__mockType === "domEventHandlers"
  )
}

function isMockAutocompleteExtension(
  extension: unknown
): extension is MockAutocompleteExtension {
  return (
    typeof extension === "object" &&
    extension !== null &&
    "__mockType" in extension &&
    (extension as { __mockType?: string }).__mockType === "autocompletion"
  )
}

function isMockLineWrappingExtension(
  extension: unknown
): extension is MockLineWrappingExtension {
  return (
    typeof extension === "object" &&
    extension !== null &&
    "__mockType" in extension &&
    (extension as { __mockType?: string }).__mockType === "lineWrapping"
  )
}

vi.mock("@codemirror/autocomplete", () => ({
  autocompletion: (): MockAutocompleteExtension => ({
    __mockType: "autocompletion",
  }),
}))

vi.mock("@codemirror/view", () => ({
  Decoration: {
    mark: (spec: { class: string }) => ({
      __mockType: "decoration",
      spec,
    }),
  },
  EditorView: {
    updateListener: {
      of: (callback: (update: MockViewUpdate) => void): MockUpdateListenerExtension => ({
        __mockType: "updateListener",
        callback,
      }),
    },
    domEventHandlers: (
      handlers: MockDomEventHandlersExtension["handlers"]
    ): MockDomEventHandlersExtension => ({
      __mockType: "domEventHandlers",
      handlers,
    }),
    lineWrapping: { __mockType: "lineWrapping" },
  },
  ViewPlugin: {
    fromClass: (pluginClass: unknown, spec: unknown) => ({
      __mockType: "viewPlugin",
      pluginClass,
      spec,
    }),
  },
}))

vi.mock("@uiw/react-codemirror", () => {
  function MockCodeMirror({
    value,
    onChange,
    onCreateEditor,
    extensions,
    basicSetup,
  }: {
    value: string
    onChange: (
      nextValue: string,
      viewUpdate: {
        state: { selection: { main: { head: number } } }
        startState: {
          doc: { toString: () => string }
          selection: { main: { head: number } }
        }
      }
    ) => void
    onCreateEditor?: (view: MockEditorView) => void
    extensions?: unknown
    basicSetup?: { lineNumbers?: boolean }
  }) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const docRef = useRef(value)
    const [docValue, setDocValue] = useState(value)
    const [isFocused, setIsFocused] = useState(false)
    const selectionRef = useRef<MockSelectionMain>({
      head: value.length,
      from: value.length,
      to: value.length,
      empty: true,
    })
    const stateRef = useRef<MockEditorState>({
      doc: {
        toString: () => docRef.current,
        sliceString: (from, to) => docRef.current.slice(from, to),
      },
      selection: {
        main: selectionRef.current,
      },
    })
    const viewRef = useRef<MockEditorView>({
      state: stateRef.current,
      hasFocus: false,
      dispatch: (transaction) => {
        const currentValue = docRef.current
        if (transaction.changes) {
          const { from, to, insert } = transaction.changes
          const nextValue = `${currentValue.slice(0, from)}${insert}${currentValue.slice(to)}`
          docRef.current = nextValue
          setDocValue(nextValue)
        }

        if (transaction.selection) {
          const anchor = transaction.selection.anchor
          selectionRef.current = {
            head: anchor,
            from: anchor,
            to: anchor,
            empty: true,
          }
          stateRef.current.selection.main = selectionRef.current
        }
      },
      focus: () => {
        textareaRef.current?.focus()
      },
      dom: {
        blur: () => {
          setIsFocused(false)
          viewRef.current.hasFocus = false
          textareaRef.current?.blur()
        },
      },
    })

    const extensionsFlat = flattenExtensions(extensions)
    const hasAutocompleteExtension = extensionsFlat.some(isMockAutocompleteExtension)
    const hasLineWrappingExtension = extensionsFlat.some(isMockLineWrappingExtension)
    const focusChangedListeners = extensionsFlat
      .filter(isMockUpdateListenerExtension)
      .map((extension) => extension.callback)
    const keydownHandlers = extensionsFlat
      .filter(isMockDomEventHandlersExtension)
      .map((extension) => extension.handlers.keydown)
      .filter((handler): handler is NonNullable<typeof handler> => Boolean(handler))

    useEffect(() => {
      onCreateEditor?.(viewRef.current)
    }, [onCreateEditor])

    useEffect(() => {
      if (viewRef.current.hasFocus) {
        return
      }

      if (value !== docRef.current) {
        docRef.current = value
        setDocValue(value)
        const anchor = value.length
        selectionRef.current = {
          head: anchor,
          from: anchor,
          to: anchor,
          empty: true,
        }
        stateRef.current.selection.main = selectionRef.current
      }
    }, [value])

    const emitFocusChanged = () => {
      for (const listener of focusChangedListeners) {
        listener({
          focusChanged: true,
          view: viewRef.current,
        })
      }
    }

    return (
      <>
        <textarea
          ref={textareaRef}
          aria-label="expression-editor"
          value={docValue}
          data-line-wrapping={hasLineWrappingExtension ? "true" : "false"}
          data-line-numbers={basicSetup?.lineNumbers ? "true" : "false"}
          onFocus={() => {
            setIsFocused(true)
            // eslint-disable-next-line react-hooks/immutability
            viewRef.current.hasFocus = true
            emitFocusChanged()
          }}
          onBlur={() => {
            setIsFocused(false)
            // eslint-disable-next-line react-hooks/immutability
            viewRef.current.hasFocus = false
            emitFocusChanged()
          }}
          data-focused={isFocused ? "true" : "false"}
          onChange={(event) => {
            const previousValue = docRef.current
            const nextValue = event.target.value
            const nextHead = event.target.selectionStart ?? nextValue.length
            const nextTail = event.target.selectionEnd ?? nextHead
            docRef.current = nextValue
            setDocValue(nextValue)
            selectionRef.current = {
              head: nextHead,
              from: nextHead,
              to: nextTail,
              empty: nextHead === nextTail,
            }
            stateRef.current.selection.main = selectionRef.current

            onChange(nextValue, {
              state: {
                selection: {
                  main: {
                    head: nextHead,
                  },
                },
              },
              startState: {
                doc: {
                  toString: () => previousValue,
                },
                selection: {
                  main: {
                    head: nextHead,
                  },
                },
              },
            })
          }}
          onKeyDown={(event) => {
            const nativeEvent = event.nativeEvent as KeyboardEvent
            for (const handler of keydownHandlers) {
              const handled = handler(nativeEvent, viewRef.current)
              if (handled) {
                break
              }
            }
          }}
        />
        {hasAutocompleteExtension && /\bemail\b/.test(docValue) ? (
          <div className="cm-tooltip cm-shadcn-autocomplete">email</div>
        ) : null}
      </>
    )
  }

  return { default: MockCodeMirror }
})

describe("ExpressionEditor integration", () => {
  afterEach(() => {
    cleanup()
  })

  beforeAll(() => {
    class ResizeObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  function ControlledExpressionEditor({
    initialValue,
    variables,
    onValueCommit,
  }: {
    initialValue: string
    variables: ExpressionVariableOption[]
    onValueCommit?: (nextValue: string) => void
  }) {
    const [value, setValue] = useState(initialValue)

    return (
      <ExpressionEditor
        value={value}
        variables={variables}
        onCommit={(nextValue) => {
          setValue(nextValue)
          onValueCommit?.(nextValue)
        }}
        placeholder="type..."
      />
    )
  }

  it("does not call onCommit while typing before blur", () => {
    const onCommit = vi.fn()

    render(
      <ExpressionEditor
        value=""
        variables={[]}
        onCommit={onCommit}
        placeholder="type..."
      />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "abc",
        selectionStart: 3,
        selectionEnd: 3,
      },
    })

    expect(onCommit).not.toHaveBeenCalled()
  })

  it("calls onCommit once with full value on blur", () => {
    const onCommit = vi.fn()

    render(
      <ExpressionEditor
        value=""
        variables={[]}
        onCommit={onCommit}
        placeholder="type..."
      />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "hello {{ myVar }}",
        selectionStart: 17,
        selectionEnd: 17,
      },
    })
    fireEvent.blur(editor)

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("hello {{ myVar }}", { reason: "blur" })
  })

  it("pressing Enter commits and blurs the editor", () => {
    const onCommit = vi.fn()

    render(
      <ControlledExpressionEditor
        initialValue=""
        variables={[]}
        onValueCommit={onCommit}
      />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "enter commit",
        selectionStart: 12,
        selectionEnd: 12,
      },
    })
    fireEvent.keyDown(editor, {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("enter commit")
    expect(editor.getAttribute("data-focused")).toBe("false")
  })

  it("updates displayed value after fast type-and-blur", async () => {
    const onCommit = vi.fn()

    render(
      <ControlledExpressionEditor
        initialValue=""
        variables={[]}
        onValueCommit={onCommit}
      />
    )

    const editor = screen.getByLabelText("expression-editor") as HTMLTextAreaElement
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "fast blur value",
        selectionStart: 15,
        selectionEnd: 15,
      },
    })
    fireEvent.blur(editor)

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("fast blur value")

    await waitFor(() => {
      expect(editor.value).toBe("fast blur value")
    })
  })

  it("inserts selected variable in wrapped expression format", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: "myVar",
        label: "myVar",
        description: "A variable",
        group: "Variables",
      },
    ]

    render(
      <ControlledExpressionEditor
        initialValue="prefix "
        variables={variables}
        onValueCommit={onCommit}
      />
    )

    const editor = screen.getByLabelText("expression-editor") as HTMLTextAreaElement
    editor.focus()
    fireEvent.change(editor, {
      target: {
        value: "prefix {{}}",
        selectionStart: "prefix {{".length,
        selectionEnd: "prefix {{".length,
      },
    })
    await user.click(screen.getByText("myVar"))

    expect(onCommit).toHaveBeenLastCalledWith("prefix {{ myVar }}")
  })

  it("does not show CodeMirror autocomplete while editing an existing token", () => {
    render(
      <ControlledExpressionEditor
        initialValue="{{ emai }}"
        variables={[
          {
            value: "email",
            label: "email",
            description: "Variable from extractor.",
            group: "Variables",
          },
        ]}
      />
    )

    const editor = screen.getByLabelText("expression-editor") as HTMLTextAreaElement
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "{{ email }}",
        selectionStart: "{{ email".length,
        selectionEnd: "{{ email".length,
      },
    })

    expect(document.querySelector(".cm-tooltip.cm-shadcn-autocomplete")).toBeNull()
  })

  it("does not enable soft line wrapping or compact line numbers", () => {
    render(
      <ExpressionEditor
        value={'{{ $node("LongName").output.really.long.path }}'}
        variables={[]}
        onCommit={vi.fn()}
        placeholder="type..."
      />
    )

    const editor = screen.getByLabelText("expression-editor")

    expect(editor.getAttribute("data-line-wrapping")).toBe("false")
    expect(editor.getAttribute("data-line-numbers")).toBe("false")
  })

  it("prevents editor wheel events from bubbling to a parent canvas", () => {
    const onParentWheel = vi.fn()

    render(
      <div onWheel={onParentWheel}>
        <ExpressionEditor
          value={'{{ $node("LongName").output.really.long.path }}'}
          variables={[]}
          onCommit={vi.fn()}
          placeholder="type..."
        />
      </div>
    )

    const editorContainer = screen.getByLabelText("expression-editor").parentElement

    expect(editorContainer?.classList.contains("nowheel")).toBe(true)

    fireEvent.wheel(editorContainer as HTMLElement, {
      deltaX: 80,
      deltaY: 0,
    })

    expect(onParentWheel).not.toHaveBeenCalled()
  })

  it("keeps real newline content in the editor value", () => {
    const value = "{{ condition\n  ? valueA\n  : valueB }}"

    render(
      <ExpressionEditor
        value={value}
        variables={[]}
        onCommit={vi.fn()}
        placeholder="type..."
      />
    )

    const editor = screen.getByLabelText("expression-editor") as HTMLTextAreaElement

    expect(editor.value).toBe(value)
    expect(editor.value.split("\n")).toHaveLength(3)
  })
})
