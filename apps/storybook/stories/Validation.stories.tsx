import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  GlobalValidationExample,
  ValidationExample,
} from "./workflow-examples/validation-example"

const meta = {
  title: "Workflow Examples/With Validation",
  component: ValidationExample,
} satisfies Meta<typeof ValidationExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithValidation: Story = {}

export const WithGlobalValidation: Story = {
  render: () => <GlobalValidationExample />,
}
