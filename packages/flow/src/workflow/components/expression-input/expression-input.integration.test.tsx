// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useRef, useState } from "react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import type { ExpressionVariableOption } from "../../types"
import { KeywordExpressionListInput } from "../../nodes/data/inline-expression/keyword-expression-list-input"
import { ExpressionInput } from "./expression-input"

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

vi.mock("@codemirror/view", () => ({
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
}))

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
    onCreateEditor,
    extensions,
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
  }) => {
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
      <textarea
        ref={textareaRef}
        aria-label="expression-editor"
        value={docValue}
        onFocus={() => {
          setIsFocused(true)
          viewRef.current.hasFocus = true
          emitFocusChanged()
        }}
        onBlur={() => {
          setIsFocused(false)
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
    )
  },
}))

describe("ExpressionInput integration", () => {
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

  function ControlledExpressionInput({
    initialValue,
    variables,
    onValueChange,
  }: {
    initialValue: string
    variables: ExpressionVariableOption[]
    onValueChange?: (nextValue: string) => void
  }) {
    const [value, setValue] = useState(initialValue)

    return (
      <ExpressionInput
        value={value}
        variables={variables}
        onChange={(nextValue) => {
          setValue(nextValue)
          onValueChange?.(nextValue)
        }}
        placeholder="type..."
      />
    )
  }

  function ControlledKeywordExpressionListInput({
    initialValue,
    variables,
    onValueChange,
  }: {
    initialValue: string[]
    variables: ExpressionVariableOption[]
    onValueChange?: (nextValue: string[]) => void
  }) {
    const [value, setValue] = useState(initialValue)

    return (
      <KeywordExpressionListInput
        value={value}
        variables={variables}
        onChange={(nextValue) => {
          setValue(nextValue)
          onValueChange?.(nextValue)
        }}
      />
    )
  }

  it("inserts selected variable in {{ ... }} format after typing {{}} trigger", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: '$node("trigger-a").item.json.eventName',
        label: '$node("trigger-a").item.json.eventName',
        description: "Trigger event",
        group: "Upstream: TriggerA",
      },
    ]

    render(
      <ControlledExpressionInput initialValue="prefix " variables={variables} onValueChange={onChange} />
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
    await user.click(screen.getByText('$node("trigger-a").item.json.eventName'))

    expect(onChange).toHaveBeenLastCalledWith('prefix {{ $node("trigger-a").item.json.eventName }}')
  })

  it("clears empty-expression error after selecting variable for {{}}", async () => {
    const user = userEvent.setup()
    const variables: ExpressionVariableOption[] = [
      {
        value: "$input.item.json",
        label: "$input.item.json",
        description: "Current input JSON",
        group: "Execution",
      },
    ]

    render(<ControlledExpressionInput initialValue="" variables={variables} />)

    const editor = screen.getByLabelText("expression-editor") as HTMLTextAreaElement
    editor.focus()
    fireEvent.change(editor, {
      target: {
        value: "{{}}",
        selectionStart: 2,
        selectionEnd: 2,
      },
    })

    expect(screen.getByText("Expression cannot be empty.")).toBeTruthy()

    await user.click(screen.getByText("$input.item.json"))

    expect(screen.queryByText("Expression cannot be empty.")).toBeNull()
  })

  it("replaces {{}} placeholder without leaving extra braces", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: "$input.item.json",
        label: "$input.item.json",
        description: "Current input JSON",
        group: "Execution",
      },
    ]

    render(
      <ControlledExpressionInput initialValue="" variables={variables} onValueChange={onChange} />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "{{}}",
        selectionStart: 2,
        selectionEnd: 2,
      },
    })
    await user.click(screen.getByText("$input.item.json"))

    expect(onChange).toHaveBeenLastCalledWith("{{ $input.item.json }}")
  })

  it("inserts selected variable on first click from a keyword expression row", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: "$input.item.json",
        label: "$input.item.json",
        description: "Current input JSON",
        group: "Execution",
      },
    ]

    render(
      <ControlledKeywordExpressionListInput
        initialValue={["prefix "]}
        variables={variables}
        onValueChange={onChange}
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

    await user.click(screen.getByText("$input.item.json"))

    expect(onChange).toHaveBeenLastCalledWith(["prefix {{ $input.item.json }}"])
    expect(screen.queryByText("$input.item.json")).toBeNull()
  })

  it("does not call onChange while typing before blur", () => {
    const onChange = vi.fn()

    render(
      <ExpressionInput
        value=""
        variables={[]}
        onChange={onChange}
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

    expect(onChange).not.toHaveBeenCalled()
  })

  it("calls onChange once with full value on blur", () => {
    const onChange = vi.fn()

    render(
      <ExpressionInput
        value=""
        variables={[]}
        onChange={onChange}
        placeholder="type..."
      />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "hello {{ $input.item.json }}",
        selectionStart: 27,
        selectionEnd: 27,
      },
    })
    fireEvent.blur(editor)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("hello {{ $input.item.json }}")
  })

  it("does not revert value after fast type-and-blur", async () => {
    const onChange = vi.fn()

    render(
      <ControlledExpressionInput
        initialValue=""
        variables={[]}
        onValueChange={onChange}
      />
    )

    const editor = screen.getByLabelText("expression-editor") as HTMLTextAreaElement
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "fast blur value",
        selectionStart: 14,
        selectionEnd: 14,
      },
    })
    fireEvent.blur(editor)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("fast blur value")

    await waitFor(() => {
      expect(editor.value).toBe("fast blur value")
    })
  })

  it("pressing Enter commits and blurs the editor", () => {
    const onChange = vi.fn()

    render(
      <ControlledExpressionInput
        initialValue=""
        variables={[]}
        onValueChange={onChange}
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

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("enter commit")
    expect(editor.getAttribute("data-focused")).toBe("false")
  })

  it("Shift+Enter does not commit and retains focus", () => {
    const onChange = vi.fn()

    render(
      <ExpressionInput
        value=""
        variables={[]}
        onChange={onChange}
        placeholder="type..."
      />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "line1",
        selectionStart: 5,
        selectionEnd: 5,
      },
    })
    fireEvent.keyDown(editor, {
      key: "Enter",
      code: "Enter",
      shiftKey: true,
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(editor.getAttribute("data-focused")).toBe("true")
  })
})
