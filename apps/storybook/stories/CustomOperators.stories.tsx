import type { Meta, StoryObj } from "@storybook/react-vite"

import { CustomOperatorsExample } from "./workflow-examples/custom-operators-example"

const meta = {
  title: "Workflow Examples/With Custom Operators",
  component: CustomOperatorsExample,
} satisfies Meta<typeof CustomOperatorsExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithCustomOperators: Story = {}
