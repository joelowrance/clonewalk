import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { PermissionCheckboxGroup } from './PermissionCheckboxGroup'
import type { Permission } from '@compliance/shared'

const meta: Meta<typeof PermissionCheckboxGroup> = {
  title: 'Components/PermissionCheckboxGroup',
  component: PermissionCheckboxGroup,
}
export default meta

type Story = StoryObj<typeof PermissionCheckboxGroup>

function Wrapper({ initial, disabled }: { initial: Permission[]; disabled?: boolean }) {
  const [value, setValue] = useState<Permission[]>(initial)
  return disabled
    ? <PermissionCheckboxGroup value={value} onChange={setValue} disabled />
    : <PermissionCheckboxGroup value={value} onChange={setValue} />
}

export const AllUnchecked: Story = {
  render: () => <Wrapper initial={[]} />,
}

export const SomeChecked: Story = {
  render: () => <Wrapper initial={['manage:users', 'manage:surveys']} />,
}

export const Disabled: Story = {
  render: () => <Wrapper initial={['manage:users', 'manage:locations']} disabled />,
}
