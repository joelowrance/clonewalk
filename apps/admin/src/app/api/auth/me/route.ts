import { NextResponse } from 'next/server'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { getAuthContext } from '@/lib/auth'

export async function GET(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, ctx.userId))
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  return NextResponse.json({ user: { id: user.id, email: user.email, tenantId: user.tenantId } })
}
