'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './InviteForm.module.css'

export function InviteForm() {
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [sentTo, setSentTo]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) { setError('Email is required'); return }
    setSubmitting(true)

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (res.status === 201) {
        setSentTo(trimmed)
      } else {
        const body = await res.json() as { error?: string }
        if (body.error === 'email_taken') setError('A user with this email already exists')
        else setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Invite user</h1>
        <p className={styles.success}>Invitation sent to {sentTo}</p>
        <button type="button" className={styles.submit} onClick={() => router.push('/users')}>
          Back to Users
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Invite user</h1>

      <div className={styles.field}>
        <label htmlFor="invite-email" className={styles.label}>Email address</label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          disabled={submitting}
          placeholder="e.g. inspector@example.com"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'invite-email-error' : undefined}
          autoFocus
        />
      </div>

      {error && <p id="invite-email-error" className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={() => router.push('/users')} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Invitation'}
        </button>
      </div>
    </form>
  )
}
