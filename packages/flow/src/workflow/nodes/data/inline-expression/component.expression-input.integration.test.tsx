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

function InlineExpressionHarness() {
  const [config, setConfig] = useState({
    template: ["lead"],
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
})
