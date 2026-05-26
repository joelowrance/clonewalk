import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/AppLayout'
import { requirePagePermission } from '@/lib/page-guard'
import { getSurvey } from '@compliance/db'
import { SurveyForm } from '@/components/SurveyForm'

export default async function SurveySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePagePermission('manage:surveys')
  const { id } = await params
  const survey = await getSurvey(ctx.tenantId, id)
  if (!survey) redirect('/surveys')

  return (
    <AppLayout>
      <SurveyForm
        surveyId={id}
        initialName={survey.name}
        initialPassingScore={survey.passingScore}
      />
    </AppLayout>
  )
}
