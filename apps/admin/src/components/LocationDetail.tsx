'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './LocationDetail.module.css'

interface Location {
  id:        string
  name:      string
  createdAt: string
}

interface Props {
  locationId: string
}

export function LocationDetail({ locationId }: Props) {
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/locations/${locationId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found')
        const data = await res.json() as { location: Location }
        setLocation(data.location)
      })
      .catch(() => setError('Failed to load location'))
      .finally(() => setLoading(false))
  }, [locationId])

  async function handleDelete() {
    if (!window.confirm('Delete this location? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/locations/${locationId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/locations')
      } else {
        setError('Failed to delete location')
        setDeleting(false)
      }
    } catch {
      setError('Failed to delete location')
      setDeleting(false)
    }
  }

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error || !location) return <p className={styles.empty}>{error ?? 'Location not found'}</p>

  return (
    <div className={styles.detail}>
      <Link href="/locations" className={styles.back}>← Locations</Link>
      <div className={styles.card}>
        <h1 className={styles.title}>{location.name}</h1>
        <p className={styles.meta}>
          Created: {new Date(location.createdAt).toLocaleDateString()}
        </p>
        <div className={styles.actions}>
          <Link href={`/locations/${locationId}/edit`} className={styles.editLink}>Edit</Link>
          <button onClick={handleDelete} disabled={deleting} className={styles.deleteButton}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
