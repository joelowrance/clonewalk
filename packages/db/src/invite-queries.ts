import { eq, and, gt, isNull } from 'drizzle-orm'
import { db } from './client'
import { inviteTokens, users } from './schema/index'

export async function createInviteToken(
  tenantId: string,
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await db.insert(inviteTokens).values({ tenantId, userId, token, expiresAt })
}

export async function getInviteToken(
  token: string,
): Promise<{ userId: string; tenantId: string; email: string } | null> {
  const now = new Date()
  const [row] = await db
    .select({
      userId:   inviteTokens.userId,
      tenantId: inviteTokens.tenantId,
      email:    users.email,
    })
    .from(inviteTokens)
    .innerJoin(users, eq(inviteTokens.userId, users.id))
    .where(
      and(
        eq(inviteTokens.token, token),
        isNull(inviteTokens.usedAt),
        gt(inviteTokens.expiresAt, now),
      ),
    )
  return row ?? null
}

export async function getRawInviteToken(
  token: string,
): Promise<{ userId: string; tenantId: string; usedAt: Date | null; expiresAt: Date } | null> {
  const [row] = await db
    .select({
      userId:    inviteTokens.userId,
      tenantId:  inviteTokens.tenantId,
      usedAt:    inviteTokens.usedAt,
      expiresAt: inviteTokens.expiresAt,
    })
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
  return row ?? null
}

export async function consumeInviteToken(
  token: string,
): Promise<{ userId: string; tenantId: string } | null> {
  const [row] = await db
    .update(inviteTokens)
    .set({ usedAt: new Date() })
    .where(eq(inviteTokens.token, token))
    .returning({ userId: inviteTokens.userId, tenantId: inviteTokens.tenantId })
  return row ?? null
}
