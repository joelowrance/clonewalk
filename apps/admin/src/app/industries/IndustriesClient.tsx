'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHead } from '@/components/ui/PageHead'
import styles from './page.module.css'

interface Industry {
  id:      string
  name:    string
  enabled: boolean
}

export function IndustriesClient() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [toggling, setToggling]     = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/industries')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { industries: Industry[] }
      setIndustries(data.industries)
    } catch {
      setError('Failed to load industries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggle(industry: Industry) {
    setToggling(industry.id)
    try {
      if (industry.enabled) {
        const res = await fetch(`/api/tenant-industries/${industry.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to disable')
      } else {
        const res = await fetch('/api/tenant-industries', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ industryId: industry.id }),
        })
        if (!res.ok) throw new Error('Failed to enable')
      }
      setIndustries(prev =>
        prev.map(i => i.id === industry.id ? { ...i, enabled: !i.enabled } : i)
      )
    } catch {
      setError(`Failed to ${industry.enabled ? 'disable' : 'enable'} ${industry.name}`)
    } finally {
      setToggling(null)
    }
  }

  const enabledCount = industries.filter(i => i.enabled).length

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  return (
    <div>
      <PageHead
        title="Industries"
        sub={`${enabledCount} of ${industries.length} enabled`}
      />

      <div className={styles.card}>
        <div className={styles.hint}>
          Enable the Industries your tenant operates in. Only enabled Industries can have Surveys.
        </div>
        <ul className={styles.list}>
          {industries.map(industry => (
            <li key={industry.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{industry.name}</span>
              </div>
              <button
                className={industry.enabled ? styles.btnDisable : styles.btnEnable}
                onClick={() => void toggle(industry)}
                disabled={toggling === industry.id}
              >
                {toggling === industry.id
                  ? '…'
                  : industry.enabled ? 'Disable' : 'Enable'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
