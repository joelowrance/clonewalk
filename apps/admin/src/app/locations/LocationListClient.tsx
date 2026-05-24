'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHead } from '@/components/ui/PageHead'
import { Pill } from '@/components/ui/Pill'
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
  const [q, setQ]                 = useState('')
  const router = useRouter()

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

  const filtered = locations.filter(l =>
    !q || l.name.toLowerCase().includes(q.toLowerCase())
  )

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  return (
    <div>
      <PageHead
        title="Locations"
        sub={`${locations.length} location${locations.length === 1 ? '' : 's'}`}
        actions={
          <Link href="/locations/new" className={styles.btnPrimary}>
            + New location
          </Link>
        }
      />

      <div className={styles.card}>
        <div className={styles.toolsRow}>
          <div className={styles.search}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
              <circle cx="7" cy="7" r="4.5"/><path d="m13.5 13.5-3-3"/>
            </svg>
            <input
              placeholder="Search by name…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <span className={styles.count}>
            {filtered.length} of {locations.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {q ? 'No locations match your search.' : 'No locations yet.'}
          </div>
        ) : (
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(loc => (
                <tr key={loc.id} onClick={() => router.push(`/locations/${loc.id}`)}>
                  <td><strong>{loc.name}</strong></td>
                  <td><Pill kind="info">Active</Pill></td>
                  <td>{new Date(loc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
