import type { Meta, StoryObj } from "@storybook/react-vite"

import { BaseExample } from "./workflow-examples/base-example"

const meta = {
  title: "Workflow Examples/Base",
  component: BaseExample,
} satisfies Meta<typeof BaseExample>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
