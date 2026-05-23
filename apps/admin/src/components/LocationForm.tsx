'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './LocationForm.module.css'

interface Props {
  locationId?: string
}

export function LocationForm({ locationId }: Props) {
  const router  = useRouter()
  const isEdit  = Boolean(locationId)

  const [name, setName]           = useState('')
  const [loading, setLoading]     = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    fetch(`/api/locations/${locationId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json() as Promise<{ location: { name: string } }>
      })
      .then(({ location }) => {
        if (!cancelled) { setName(location.name); setLoading(false) }
      })
      .catch(() => { if (!cancelled) { setError('Failed to load location'); setLoading(false) } })
    return () => { cancelled = true }
  }, [locationId, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required'); return }
    setSubmitting(true)

    const url    = isEdit ? `/api/locations/${locationId}` : '/api/locations'
    const method = isEdit ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.status === 201 || res.status === 200) {
        const body = await res.json() as { location: { id: string } }
        router.push(`/locations/${body.location.id}`)
      } else {
        const body = await res.json() as { error?: string }
        if (body.error === 'name_taken') setError('A location with this name already exists')
        else setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className={styles.loading}>Loading…</p>

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>{isEdit ? 'Edit location' : 'New location'}</h1>

      <div className={styles.field}>
        <label htmlFor="location-name" className={styles.label}>Location name</label>
        <input
          id="location-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          disabled={submitting}
          maxLength={100}
          placeholder="e.g. Central Blood Bank"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'location-name-error' : undefined}
          autoFocus
        />
      </div>

      {error && <p id="location-name-error" className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={() => router.push(isEdit ? `/locations/${locationId}` : '/locations')} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create location'}
        </button>
      </div>
    </form>
  )
}
