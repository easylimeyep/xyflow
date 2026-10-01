import type { Meta, StoryObj } from "@storybook/react-vite"

import { VariableScopeExample } from "./workflow-examples/variable-scope-example"

const meta = {
  title: "Workflow Examples/With Variable Scope",
  component: VariableScopeExample,
  argTypes: {
    scope: {
      control: "inline-radio",
      options: ["upstream", "global"],
    },
  },
} satisfies Meta<typeof VariableScopeExample>

export default meta
type Story = StoryObj<typeof meta>

export const GlobalScope: Story = {
  args: { scope: "global" },
}

export const UpstreamScope: Story = {
  args: { scope: "upstream" },
}
