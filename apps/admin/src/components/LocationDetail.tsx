'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHead } from '@/components/ui/PageHead'
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

  const [editing, setEditing]     = useState(false)
  const [editName, setEditName]   = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [deleteError, setDeleteError]     = useState<string | null>(null)

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

  function openEdit() {
    if (!location) return
    setEditName(location.name)
    setEditError(null)
    setEditing(true)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed) { setEditError('Name is required'); return }
    setEditSaving(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        const body = await res.json() as { location: Location }
        setLocation(body.location)
        setEditing(false)
      } else {
        const body = await res.json() as { error?: string }
        setEditError(body.error === 'name_taken' ? 'A location with this name already exists' : 'Something went wrong')
      }
    } catch {
      setEditError('Something went wrong')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/locations/${locationId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/locations')
      } else {
        setDeleteError('Failed to delete location')
        setDeleting(false)
      }
    } catch {
      setDeleteError('Failed to delete location')
      setDeleting(false)
    }
  }

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error || !location) return <p className={styles.empty}>{error ?? 'Location not found'}</p>

  const crumbs = (
    <>
      <Link href="/locations">Locations</Link>
      <span className={styles.crumbSep}>/</span>
      <span>{location.name}</span>
    </>
  )

  return (
    <>
      <PageHead
        title={location.name}
        crumbs={crumbs}
        actions={
          <>
            <button className={styles.btn} onClick={openEdit}>Edit</button>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setConfirmDelete(true)}>Archive</button>
          </>
        }
      />

      <div className={styles.card}>
        <div className={styles.cardHd}><h3>Details</h3></div>
        <div className={styles.cardBody}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>ID</span>
            <span className={styles.detailMono}>{location.id}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Name</span>
            <span className={styles.detailValue}>{location.name}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Created</span>
            <span className={styles.detailMono}>{new Date(location.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {editing && (
        <div
          className={styles.modalVeil}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(false) }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHd}>
              <h2>Edit location</h2>
            </div>
            <form onSubmit={handleEditSave}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label htmlFor="edit-name">Location name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={editSaving}
                    maxLength={100}
                    autoFocus
                  />
                </div>
                {editError && <p className={styles.fieldError} role="alert">{editError}</p>}
              </div>
              <div className={styles.modalFoot}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setEditing(false)} disabled={editSaving}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className={styles.modalVeil}
          onClick={(e) => { if (e.target === e.currentTarget) { setConfirmDelete(false); setDeleteError(null) } }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHd}>
              <h2>Archive {location.name}?</h2>
              <div className={styles.modalSub}>The location will be hidden from active audits and reports. Historical data remains accessible.</div>
            </div>
            <div className={styles.modalBody}>
              {deleteError && <p className={styles.fieldError} role="alert">{deleteError}</p>}
            </div>
            <div className={styles.modalFoot}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { setConfirmDelete(false); setDeleteError(null) }} disabled={deleting}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Archive'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
