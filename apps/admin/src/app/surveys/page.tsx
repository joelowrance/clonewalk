import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { SurveyListClient } from './SurveyListClient'

export default async function SurveysPage() {
  await requirePagePermission('manage:surveys')
  return (
    <AppLayout>
      <SurveyListClient />
    </AppLayout>
  )
}
