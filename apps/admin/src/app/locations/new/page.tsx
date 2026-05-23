import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { LocationForm } from '@/components/LocationForm'

export default async function NewLocationPage() {
  await requirePagePermission('manage:locations')
  return (
    <AppLayout>
      <LocationForm />
    </AppLayout>
  )
}
