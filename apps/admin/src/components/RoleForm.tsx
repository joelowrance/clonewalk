'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PermissionCheckboxGroup } from './PermissionCheckboxGroup'
import styles from './RoleForm.module.css'
import type { Permission } from '@compliance/shared'

interface RoleFormProps {
  roleId?:  string
  initial?: { name: string; permissions: Permission[] }
}

export function RoleForm({ roleId, initial }: RoleFormProps) {
  const router  = useRouter()
  const isEdit  = Boolean(roleId)

  const [name, setName]               = useState(initial?.name ?? '')
  const [permissions, setPermissions] = useState<Permission[]>(initial?.permissions ?? [])
  const [loading, setLoading]         = useState(!initial && isEdit)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || initial) return

    let cancelled = false
    fetch('/api/roles')
      .then((r) => r.json() as Promise<{ roles: Array<{ id: string; name: string; permissions: Permission[] }> }>)
      .then(({ roles }) => {
        if (cancelled) return
        const role = roles.find((r) => r.id === roleId)
        if (role) {
          setName(role.name)
          setPermissions(role.permissions)
        } else {
          setError('Role not found')
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setError('Failed to load role') })
    return () => { cancelled = true }
  }, [roleId, isEdit, initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      setSubmitting(false)
      return
    }

    const url    = isEdit ? `/api/roles/${roleId}` : '/api/roles'
    const method = isEdit ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed, permissions }),
      })

      if (res.status === 201 || res.status === 200) {
        router.push('/roles')
      } else {
        const body = await res.json() as { error?: string; fields?: Record<string, string> }
        if (body.error === 'name_taken') setError('A role with this name already exists')
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
      <h1 className={styles.title}>{isEdit ? 'Edit role' : 'New role'}</h1>

      <div className={styles.field}>
        <label htmlFor="role-name" className={styles.label}>Role name</label>
        <input
          id="role-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          disabled={submitting}
          maxLength={100}
          placeholder="e.g. Inspector"
        />
      </div>

      <PermissionCheckboxGroup
        value={permissions}
        onChange={setPermissions}
        disabled={submitting}
      />

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={() => router.push('/roles')} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create role'}
        </button>
      </div>
    </form>
  )
}
