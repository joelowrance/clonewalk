import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { UserDetail } from '@/components/UserDetail'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission('manage:users')
  const { id } = await params
  return (
    <AppLayout>
      <UserDetail userId={id} />
    </AppLayout>
  )
}
