'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './SetPasswordForm.module.css'

interface Props {
  token: string
  email: string
}

export function SetPasswordForm({ token, email }: Props) {
  const router = useRouter()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!password) { setError('Password is required'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSubmitting(true)

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/')
      } else if (res.status === 400) {
        setError('Password is required')
      } else if (res.status === 410) {
        setError('This invitation link is invalid or has expired.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Set your password</h1>
      <p className={styles.email}>{email}</p>

      <div className={styles.field}>
        <label htmlFor="set-password" className={styles.label}>Password</label>
        <input
          id="set-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="set-password-confirm" className={styles.label}>Confirm password</label>
        <input
          id="set-password-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={styles.input}
          disabled={submitting}
        />
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Activating…' : 'Activate account'}
      </button>
    </form>
  )
}
