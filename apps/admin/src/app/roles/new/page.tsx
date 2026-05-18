import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { RoleForm } from '@/components/RoleForm'

export default async function NewRolePage() {
  await requirePagePermission('manage:users')
  return (
    <AppLayout>
      <RoleForm />
    </AppLayout>
  )
}
