'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface Role {
  id:          string
  name:        string
  permissions: string[]
  userCount:   number
  createdAt:   string
}

export function RoleListClient() {
  const [roles, setRoles]     = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/roles')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { roles: Role[] }
      setRoles(data.roles)
    } catch {
      setError('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleDelete(id: string) {
    setDeleteError(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== id))
      } else {
        const body = await res.json() as { error?: string }
        if (body.error === 'role_in_use') {
          setDeleteError('Remove all users from this role before deleting')
        } else {
          setDeleteError('Failed to delete role')
        }
      }
    } catch {
      setDeleteError('Failed to delete role')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Roles</h1>
        <Link href="/roles/new" className={styles.newButton}>New role</Link>
      </div>

      {deleteError && <p className={styles.deleteError} role="alert">{deleteError}</p>}

      {roles.length === 0 ? (
        <p className={styles.empty}>No roles yet. <Link href="/roles/new">Create one</Link>.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Permissions</th>
              <th className={styles.th}>Users</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className={styles.tr}>
                <td className={styles.td}>
                  <Link href={`/roles/${role.id}`} className={styles.link}>{role.name}</Link>
                </td>
                <td className={styles.td}>{role.permissions.length}</td>
                <td className={styles.td}>{role.userCount}</td>
                <td className={styles.tdActions}>
                  <Link href={`/roles/${role.id}`} className={styles.editLink}>Edit</Link>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(role.id)}
                    disabled={deleting === role.id}
                  >
                    {deleting === role.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
