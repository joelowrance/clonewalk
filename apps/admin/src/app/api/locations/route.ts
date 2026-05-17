import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/permissions'
import type { AuthContext } from '@/lib/auth'

export const GET = requirePermission('manage:locations')(
  async (_req: Request, _ctx: AuthContext) => NextResponse.json({ locations: [] })
)
