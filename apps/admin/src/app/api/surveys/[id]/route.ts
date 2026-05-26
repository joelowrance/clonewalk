import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, getSurvey, updateSurvey, listIndustriesWithTenantStatus } from '@compliance/db'
import type { AuthContext } from '@/lib/auth'

async function guardManageSurveys(req: Request): Promise<{ ctx: AuthContext; res: null } | { ctx: null; res: Response }> {
  const ctx = await getAuthContext(req)
  if (!ctx) return { ctx: null, res: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:surveys')) return { ctx: null, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { ctx, res: null }
}

function serializeSurvey(s: { id: string; name: string; industryId: string; passingScore: number; isCurrent: boolean; createdAt: Date }, industryName: string) {
  return {
    id: s.id,
    name: s.name,
    industryId: s.industryId,
    industryName,
    passingScore: s.passingScore,
    isCurrent: s.isCurrent,
    createdAt: s.createdAt.toISOString(),
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const { id } = await params
  const survey = await getSurvey(ctx.tenantId, id)
  if (!survey) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const industries = await listIndustriesWithTenantStatus(ctx.tenantId)
  const industryMap = new Map(industries.map(i => [i.id, i.name]))

  return NextResponse.json({ survey: serializeSurvey(survey, industryMap.get(survey.industryId) ?? '') })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const { id } = await params
  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: {} }, { status: 400 })
  }

  const { name, passingScore } = body as Record<string, unknown>
  const update: { name?: string; passingScore?: number } = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 200) {
      return NextResponse.json({ error: 'validation_error', fields: { name: 'must be 1–200 characters' } }, { status: 400 })
    }
    update.name = name.trim()
  }

  if (passingScore !== undefined) {
    const score = parseInt(String(passingScore), 10)
    if (isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: 'validation_error', fields: { passingScore: 'must be a number between 0 and 100' } }, { status: 400 })
    }
    update.passingScore = score
  }

  const result = await updateSurvey(ctx.tenantId, id, update)
  if ('error' in result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const industries = await listIndustriesWithTenantStatus(ctx.tenantId)
  const industryMap = new Map(industries.map(i => [i.id, i.name]))

  return NextResponse.json({ survey: serializeSurvey(result.survey, industryMap.get(result.survey.industryId) ?? '') })
}
