import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { LocationDetail } from '@/components/LocationDetail'

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission('manage:locations')
  const { id } = await params
  return (
    <AppLayout>
      <LocationDetail locationId={id} />
    </AppLayout>
  )
}
