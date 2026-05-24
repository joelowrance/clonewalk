import type { Meta, StoryObj } from '@storybook/react'
import type { Decorator } from '@storybook/react'
import { UserDetail } from './UserDetail'

const meta: Meta<typeof UserDetail> = {
  title: 'Components/UserDetail',
  component: UserDetail,
}
export default meta

type Story = StoryObj<typeof UserDetail>

const mockUser = {
  id:   'preview-user-id',
  email: 'alice@example.com',
  status: 'active',
  roles: [{ id: 'role-1', name: 'Inspector' }],
  overrides: [{ permission: 'manage:surveys', granted: true }],
  effectivePermissions: ['conduct:walkthroughs', 'manage:surveys'],
}

const mockRoles = [
  { id: 'role-1', name: 'Inspector' },
  { id: 'role-2', name: 'Tenant Admin' },
]

const withMockedFetch: Decorator = (Story) => {
  window.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    if (/\/api\/users\//.test(url)) {
      return new Response(JSON.stringify({ user: mockUser }), { headers: { 'content-type': 'application/json' } })
    }
    return new Response(JSON.stringify({ roles: mockRoles }), { headers: { 'content-type': 'application/json' } })
  }
  return <Story />
}

export const WithRolesAndOverrides: Story = {
  args: { userId: 'preview-user-id' },
  decorators: [withMockedFetch],
}

export const NoRolesExist: Story = {
  args: { userId: 'preview-user-id' },
  decorators: [
    (Story) => {
      window.fetch = async (input) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
        if (/\/api\/users\//.test(url)) {
          return new Response(
            JSON.stringify({ user: { ...mockUser, roles: [], overrides: [], effectivePermissions: [] } }),
            { headers: { 'content-type': 'application/json' } },
          )
        }
        return new Response(JSON.stringify({ roles: [] }), { headers: { 'content-type': 'application/json' } })
      }
      return <Story />
    },
  ],
}
