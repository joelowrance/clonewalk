import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { RoleForm } from '@/components/RoleForm'

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission('manage:users')
  const { id } = await params
  return (
    <AppLayout>
      <RoleForm roleId={id} />
    </AppLayout>
  )
}
