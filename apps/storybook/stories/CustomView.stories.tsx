import type { Meta, StoryObj } from "@storybook/react-vite"

import { CustomViewExample } from "./workflow-examples/custom-view-example"

const meta = {
  title: "Workflow Examples/With Custom Node Renderer",
  component: CustomViewExample,
} satisfies Meta<typeof CustomViewExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithCustomNodeRenderer: Story = {}
