// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { NodeConfigUpdate } from "../../../store/types"
import { InlineExpressionNode } from "./component"

const mockUpdateNodeConfig = vi.fn()
let handleConfigUpdate: ((update: NodeConfigUpdate) => void) | null = null

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("@workspace/expression-editor", () => ({
  ExpressionEditor: ({
    value,
    onCommit,
    onLiveChange,
  }: {
    value: string
    onCommit: (nextValue: string) => void
    onLiveChange?: (nextValue: string) => void
  }) => {
    const [liveValue, setLiveValue] = useState(value)
    useEffect(() => {
      setLiveValue(value)
    }, [value])

    return (
      <textarea
        aria-label="expression-editor"
        value={liveValue}
        onChange={(event) => {
          const nextValue = event.target.value
          setLiveValue(nextValue)
          onLiveChange?.(nextValue)
        }}
        onBlur={() => {
          if (liveValue !== value) {
            onCommit(liveValue)
          }
        }}
      />
    )
  },
}))

vi.mock("../../shared/use-node-store-data", () => ({
  useNodeStoreData: () => ({
    expressionVariables: [],
    updateNodeConfig: (nodeId: string, update: NodeConfigUpdate) => {
      mockUpdateNodeConfig(nodeId, update)
      handleConfigUpdate?.(update)
    },
    isSetVariableNameUnique: () => true,
  }),
}))

vi.mock("../../node-shell/node-shell", () => ({
  NodeShell: ({
    showTarget = true,
    headerAccessory,
    children,
  }: {
    showTarget?: boolean
    headerAccessory?: ReactNode
    children?: ReactNode
  }) => (
    <div data-testid="node-shell" data-show-target={String(showTarget)}>
      {headerAccessory}
      {children}
    </div>
  ),
}))

function createNodeProps(config: {
  template: string[]
  isRoot: boolean
  repeatable: boolean
  caseSensitive: boolean
}): NodeProps {
  return {
    id: "inline-node-1",
    type: "inlineExpression",
    data: {
      kind: "inlineExpression",
      label: "Inline Node",
      config,
    },
    selected: false,
    dragging: false,
    zIndex: 1,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    sourcePosition: undefined,
    targetPosition: undefined,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

function InlineExpressionHarness({
  template = ["lead"],
}: {
  template?: string[]
}) {
  const [config, setConfig] = useState({
    template,
    isRoot: false,
    repeatable: false,
    caseSensitive: false,
  })
  handleConfigUpdate = (update) => {
    setConfig((currentConfig) => ({
      ...currentConfig,
      template: [...currentConfig.template],
      [update.key]: update.value,
    }))
  }

  return <InlineExpressionNode {...createNodeProps(config)} />
}

describe("InlineExpressionNode with real ExpressionInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    handleConfigUpdate = null
  })

  afterEach(() => {
    cleanup()
    handleConfigUpdate = null
  })

  it("preserves token draft when Case sensitive updates node config", () => {
    render(<InlineExpressionHarness />)

    const editor = screen.getByLabelText(
      "expression-editor"
    ) as HTMLTextAreaElement
    fireEvent.focus(editor)
    fireEvent.change(editor, {
      target: {
        value: "leadDraft",
        selectionStart: 9,
        selectionEnd: 9,
      },
    })

    fireEvent.click(screen.getByRole("checkbox", { name: /Case sensitive/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "caseSensitive",
      value: true,
    })
    expect(editor.value).toBe("leadDraft")
  })

  it("preserves token draft when Add token is clicked from the empty visual row", () => {
    render(<InlineExpressionHarness template={[]} />)

    const editor = screen.getByLabelText(
      "expression-editor"
    ) as HTMLTextAreaElement
    fireEvent.change(editor, {
      target: {
        value: "leadDraft",
        selectionStart: 9,
        selectionEnd: 9,
      },
    })

    fireEvent.click(screen.getByRole("button", { name: /Add token/i }))

    expect(mockUpdateNodeConfig).toHaveBeenLastCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["leadDraft", ""],
    })
    expect(
      (screen.getAllByLabelText("expression-editor")[0] as HTMLTextAreaElement)
        .value
    ).toBe("leadDraft")
  })

  it("preserves edited token draft when Add token is clicked", () => {
    render(<InlineExpressionHarness template={["lead"]} />)

    const editor = screen.getByLabelText(
      "expression-editor"
    ) as HTMLTextAreaElement
    fireEvent.change(editor, {
      target: {
        value: "editedLead",
        selectionStart: 10,
        selectionEnd: 10,
      },
    })

    fireEvent.click(screen.getByRole("button", { name: /Add token/i }))

    expect(mockUpdateNodeConfig).toHaveBeenLastCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["editedLead", ""],
    })
  })

  it("does not append a token row from an invalid live draft", () => {
    render(<InlineExpressionHarness template={["lead"]} />)

    const editor = screen.getByLabelText(
      "expression-editor"
    ) as HTMLTextAreaElement
    fireEvent.change(editor, {
      target: {
        value: "lead score",
        selectionStart: 10,
        selectionEnd: 10,
      },
    })

    expect(screen.getByText(/Tokens cannot contain spaces/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /Add token/i }))

    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
    expect(editor.value).toBe("lead score")
  })

  it("preserves remaining valid token drafts when deleting another row", () => {
    render(<InlineExpressionHarness template={["lead", "tail"]} />)

    const firstEditor = screen.getAllByLabelText(
      "expression-editor"
    )[0] as HTMLTextAreaElement
    fireEvent.change(firstEditor, {
      target: {
        value: "editedLead",
        selectionStart: 10,
        selectionEnd: 10,
      },
    })

    fireEvent.click(screen.getByRole("button", { name: /Delete token 2/i }))

    expect(mockUpdateNodeConfig).toHaveBeenLastCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["editedLead"],
    })
  })
})
