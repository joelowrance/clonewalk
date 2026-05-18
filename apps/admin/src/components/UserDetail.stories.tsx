import type { Meta, StoryObj } from '@storybook/react'
import { UserDetail } from './UserDetail'

const meta: Meta<typeof UserDetail> = {
  title: 'Components/UserDetail',
  component: UserDetail,
}
export default meta

type Story = StoryObj<typeof UserDetail>

export const WithRolesAndOverrides: Story = {
  args: {
    userId: 'preview-user-id',
  },
}
