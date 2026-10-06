import type { Meta, StoryObj } from "@storybook/react-vite"

import { TourAnchorsExample } from "./workflow-examples/tour-anchors-example"

const meta = {
  title: "Workflow Examples/Tour With Media",
  component: TourAnchorsExample,
  argTypes: {
    mediaBaseUrl: { control: "text" },
  },
} satisfies Meta<typeof TourAnchorsExample>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The full editor tour with recorded clips above the text. Clips are served
 * from apps/web/public/tour via `staticDirs`; the base URL is relative to the
 * preview iframe so it also works when Storybook is hosted under a subpath.
 * Steps without media keep the compact text-only panel.
 */
export const TourWithMedia: Story = {
  args: { mediaBaseUrl: "./" },
}
