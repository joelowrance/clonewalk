'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHead } from '@/components/ui/PageHead'
import styles from './page.module.css'

interface Survey {
  id:           string
  name:         string
  industryId:   string
  industryName: string
  passingScore: number
  isCurrent:    boolean
  createdAt:    string
}

export function SurveyListClient() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/surveys')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { surveys: Survey[] }
      setSurveys(data.surveys)
    } catch {
      setError('Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  return (
    <div>
      <PageHead
        title="Surveys"
        sub={`${surveys.length} survey${surveys.length === 1 ? '' : 's'}`}
        actions={
          <Link href="/surveys/new" className={styles.btnPrimary}>
            + New survey
          </Link>
        }
      />

      <div className={styles.card}>
        {surveys.length === 0 ? (
          <div className={styles.emptyState}>
            No surveys yet.{' '}
            <Link href="/surveys/new" className={styles.btnPrimary} style={{ marginLeft: 8 }}>
              + New survey
            </Link>
          </div>
        ) : (
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Passing score</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map(survey => (
                <tr key={survey.id} onClick={() => router.push(`/surveys/${survey.id}`)}>
                  <td><strong>{survey.name}</strong></td>
                  <td>{survey.industryName}</td>
                  <td>{survey.passingScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
