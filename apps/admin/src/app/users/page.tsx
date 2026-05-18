import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { UserListClient } from './UserListClient'

export default async function UsersPage() {
  await requirePagePermission('manage:users')
  return (
    <AppLayout>
      <UserListClient />
    </AppLayout>
  )
}
