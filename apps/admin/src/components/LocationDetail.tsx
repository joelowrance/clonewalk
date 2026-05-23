'use client'

import { useState, useEffect } from 'react'
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
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

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
      </div>
    </div>
  )
}
