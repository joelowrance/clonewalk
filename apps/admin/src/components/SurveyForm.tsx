'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './SurveyForm.module.css'

interface Industry {
  id:   string
  name: string
}

type Props =
  | { industries: Industry[]; surveyId?: never; initialName?: never; initialPassingScore?: never }
  | { industries?: never; surveyId: string; initialName: string; initialPassingScore: number }

export function SurveyForm(props: Props) {
  const router     = useRouter()
  const isEdit     = 'surveyId' in props && Boolean(props.surveyId)

  const [industryId, setIndustryId]   = useState(isEdit ? '' : (props.industries?.[0]?.id ?? ''))
  const [name, setName]               = useState(isEdit ? props.initialName ?? '' : '')
  const [passingScore, setPassingScore] = useState<string>(isEdit ? String(props.initialPassingScore ?? 0) : '0')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [saved, setSaved]             = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const trimmedName = name.trim()
    if (!trimmedName) { setError('Name is required'); return }

    setSubmitting(true)
    try {
      if (isEdit) {
        const res = await fetch(`/api/surveys/${props.surveyId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, passingScore: parseInt(passingScore, 10) }),
        })
        if (res.ok) {
          setSaved(true)
        } else {
          const body = await res.json() as { error?: string }
          if (res.status === 404) setError('Survey not found')
          else setError(body.error ?? 'Something went wrong. Please try again.')
        }
      } else {
        const res = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, industryId, passingScore: parseInt(passingScore, 10) }),
        })
        if (res.status === 201) {
          const body = await res.json() as { survey: { id: string } }
          router.push(`/surveys/${body.survey.id}`)
        } else if (res.status === 409) {
          setError('This industry already has a survey')
        } else {
          const body = await res.json() as { error?: string }
          setError(body.error ?? 'Something went wrong. Please try again.')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>{isEdit ? 'Survey settings' : 'New survey'}</h1>

      {!isEdit && (
        <div className={styles.field}>
          <label htmlFor="survey-industry" className={styles.label}>Industry</label>
          <select
            id="survey-industry"
            value={industryId}
            onChange={e => setIndustryId(e.target.value)}
            className={styles.select}
            disabled={submitting}
          >
            {(props.industries ?? []).map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="survey-name" className={styles.label}>Survey name</label>
        <input
          id="survey-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={styles.input}
          disabled={submitting}
          maxLength={200}
          placeholder="e.g. Annual Blood Bank Compliance Survey"
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="survey-passing-score" className={styles.label}>Passing score (%)</label>
        <input
          id="survey-passing-score"
          type="number"
          min={0}
          max={100}
          value={passingScore}
          onChange={e => setPassingScore(e.target.value)}
          className={styles.input}
          disabled={submitting}
        />
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {saved && <p className={styles.saved} role="status">Saved</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => router.push(isEdit ? `/surveys/${props.surveyId}` : '/surveys')}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create survey'}
        </button>
      </div>
    </form>
  )
}
