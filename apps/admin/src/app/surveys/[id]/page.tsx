import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/AppLayout'
import { QuestionList } from '@/components/QuestionList'
import { requirePagePermission } from '@/lib/page-guard'
import { getSurvey } from '@compliance/db'

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePagePermission('manage:surveys')
  const { id } = await params
  const survey = await getSurvey(ctx.tenantId, id)
  if (!survey) redirect('/surveys')

  return (
    <AppLayout>
      <div>
        <h1>{survey.name}</h1>
        <p>Passing score: {survey.passingScore}%</p>
        <Link href={`/surveys/${id}/settings`}>Settings</Link>
        <QuestionList surveyId={id} />
      </div>
    </AppLayout>
  )
}
