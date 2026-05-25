import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { IndustriesClient } from './IndustriesClient'

export default async function IndustriesPage() {
  await requirePagePermission('manage:industries')
  return (
    <AppLayout>
      <IndustriesClient />
    </AppLayout>
  )
}
