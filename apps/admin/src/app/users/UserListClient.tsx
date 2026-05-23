'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface UserRow {
  id:     string
  email:  string
  status: 'active' | 'pending'
  roles:  Array<{ id: string; name: string }>
}

export function UserListClient() {
  const [users, setUsers]   = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { users: UserRow[] }
      setUsers(data.users)
    } catch {
      setError('Failed to load users')
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
        <h1 className={styles.title}>Users</h1>
        <Link href="/users/invite" className={styles.inviteButton}>Invite User</Link>
      </div>

      {users.length === 0 ? (
        <p className={styles.empty}>No users found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={styles.tr}>
                <td className={styles.td}>
                  <Link href={`/users/${user.id}`} className={styles.link}>{user.email}</Link>
                </td>
                <td className={styles.td}>
                  <span className={styles.status} data-status={user.status}>{user.status}</span>
                </td>
                <td className={styles.td}>
                  {user.roles.length === 0
                    ? <span className={styles.noRoles}>No roles</span>
                    : user.roles.map((r) => r.name).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
