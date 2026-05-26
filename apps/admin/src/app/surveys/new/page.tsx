import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { listIndustriesWithTenantStatus } from '@compliance/db'
import { SurveyForm } from '@/components/SurveyForm'

export default async function NewSurveyPage() {
  const ctx = await requirePagePermission('manage:surveys')
  const industries = await listIndustriesWithTenantStatus(ctx.tenantId)
  const enabled = industries.filter(i => i.enabled)
  return (
    <AppLayout>
      <SurveyForm industries={enabled} />
    </AppLayout>
  )
}
