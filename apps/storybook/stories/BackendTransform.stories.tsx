import type { Meta, StoryObj } from "@storybook/react-vite"

import { BackendTransformExample } from "./workflow-examples/backend-transform-example"

const meta = {
  title: "Workflow Examples/With Backend Transform",
  component: BackendTransformExample,
} satisfies Meta<typeof BackendTransformExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithBackendTransform: Story = {}
