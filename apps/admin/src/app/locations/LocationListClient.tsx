'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface Location {
  id:        string
  name:      string
  createdAt: string
}

export function LocationListClient() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/locations')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { locations: Location[] }
      setLocations(data.locations)
    } catch {
      setError('Failed to load locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Locations</h1>
        <Link href="/locations/new" className={styles.newButton}>New location</Link>
      </div>

      {locations.length === 0 ? (
        <p className={styles.empty}>No locations yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className={styles.tr}>
                <td className={styles.td}>
                  <Link href={`/locations/${loc.id}`} className={styles.link}>{loc.name}</Link>
                </td>
                <td className={styles.td}>
                  {new Date(loc.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
