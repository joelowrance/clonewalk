import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, listSurveys, createSurvey, listIndustriesWithTenantStatus } from '@compliance/db'
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

export async function GET(req: Request) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const [surveys, industries] = await Promise.all([
    listSurveys(ctx.tenantId),
    listIndustriesWithTenantStatus(ctx.tenantId),
  ])

  const industryMap = new Map(industries.map(i => [i.id, i.name]))

  return NextResponse.json({
    surveys: surveys.map(s => serializeSurvey(s, industryMap.get(s.industryId) ?? '')),
  })
}

export async function POST(req: Request) {
  const { ctx, res } = await guardManageSurveys(req)
  if (!ctx) return res!

  const body = await req.json() as unknown
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'validation_error', fields: { name: 'required', industryId: 'required', passingScore: 'required' } }, { status: 400 })
  }

  const { name, industryId, passingScore } = body as Record<string, unknown>

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 200) {
    return NextResponse.json({ error: 'validation_error', fields: { name: 'must be 1–200 characters' } }, { status: 400 })
  }
  if (!industryId || typeof industryId !== 'string') {
    return NextResponse.json({ error: 'validation_error', fields: { industryId: 'required' } }, { status: 400 })
  }
  const score = parseInt(String(passingScore), 10)
  if (passingScore === undefined || passingScore === null || isNaN(score) || score < 0 || score > 100) {
    return NextResponse.json({ error: 'validation_error', fields: { passingScore: 'must be a number between 0 and 100' } }, { status: 400 })
  }

  // Check if industry already has a survey for this tenant
  const existing = await listSurveys(ctx.tenantId, industryId)
  if (existing.length > 0) {
    return NextResponse.json({ error: 'industry_already_has_survey' }, { status: 409 })
  }

  const result = await createSurvey(ctx.tenantId, { name: name.trim(), industryId, passingScore: score })
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  const industries = await listIndustriesWithTenantStatus(ctx.tenantId)
  const industryMap = new Map(industries.map(i => [i.id, i.name]))

  return NextResponse.json({ survey: serializeSurvey(result.survey, industryMap.get(result.survey.industryId) ?? '') }, { status: 201 })
}
