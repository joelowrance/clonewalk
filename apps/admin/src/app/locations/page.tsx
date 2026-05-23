import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { LocationListClient } from './LocationListClient'

export default async function LocationsPage() {
  await requirePagePermission('manage:locations')
  return (
    <AppLayout>
      <LocationListClient />
    </AppLayout>
  )
}
