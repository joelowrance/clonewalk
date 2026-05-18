import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { RoleListClient } from './RoleListClient'

export default async function RolesPage() {
  await requirePagePermission('manage:users')
  return (
    <AppLayout>
      <RoleListClient />
    </AppLayout>
  )
}
