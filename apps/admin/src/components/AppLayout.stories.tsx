import type { Meta, StoryObj } from '@storybook/react'
import { AppLayout } from './AppLayout'

const meta: Meta<typeof AppLayout> = {
  component: AppLayout,
  title: 'Components/AppLayout',
}

export default meta
type Story = StoryObj<typeof AppLayout>

export const Default: Story = {
  args: {
    children: <p>Main content area</p>,
  },
}

export const NarrowViewport: Story = {
  args: {
    children: <p>Main content area</p>,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
