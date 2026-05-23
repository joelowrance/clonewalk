import { SetPasswordForm } from '@/components/SetPasswordForm'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InviteTokenPage({ params }: Props) {
  const { token } = await params

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  let email: string | null = null

  try {
    const res = await fetch(`${appUrl}/api/invite/${token}`, { cache: 'no-store' })
    if (res.ok) {
      const body = await res.json() as { email: string }
      email = body.email
    }
  } catch {
    // invalid token
  }

  if (!email) {
    return (
      <main style={{ padding: '2rem', maxWidth: '480px', margin: '4rem auto' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          This invitation link is invalid or has expired.
        </p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '480px', margin: '4rem auto' }}>
      <SetPasswordForm token={token} email={email} />
    </main>
  )
}
