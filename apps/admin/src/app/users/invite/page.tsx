import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { InviteForm } from '@/components/InviteForm'

export default async function InvitePage() {
  await requirePagePermission('manage:users')
  return <AppLayout><InviteForm /></AppLayout>
}
