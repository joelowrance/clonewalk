import type { Meta, StoryObj } from '@storybook/react'
import { RoleForm } from './RoleForm'

const meta: Meta<typeof RoleForm> = {
  title: 'Components/RoleForm',
  component: RoleForm,
}
export default meta

type Story = StoryObj<typeof RoleForm>

export const CreateMode: Story = {
  args: {},
}

export const EditMode: Story = {
  args: {
    roleId:  'abc-123',
    initial: {
      name:        'Auditor',
      permissions: ['manage:surveys', 'manage:inspections'],
    },
  },
}
