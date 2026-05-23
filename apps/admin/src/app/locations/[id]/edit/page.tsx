import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { LocationForm } from '@/components/LocationForm'

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission('manage:locations')
  const { id } = await params
  return (
    <AppLayout>
      <LocationForm locationId={id} />
    </AppLayout>
  )
}
