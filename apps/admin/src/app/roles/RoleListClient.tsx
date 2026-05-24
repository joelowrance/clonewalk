'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHead } from '@/components/ui/PageHead'
import { Pill } from '@/components/ui/Pill'
import { PERMISSIONS } from '@compliance/shared'
import styles from './page.module.css'

interface Role {
  id:          string
  name:        string
  permissions: string[]
  userCount:   number
  createdAt:   string
}

interface UserRow {
  id:     string
  email:  string
  status: 'active' | 'pending'
  roles:  Array<{ id: string; name: string }>
}

const ROLE_HUES   = [210, 160, 340, 50, 280, 20, 190]
const AVATAR_HUES = [210, 280, 340, 20, 160, 50, 190]

function strHue(s: string, palette: number[]): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff
  return palette[h % palette.length] ?? palette[0]!
}

function emailInitials(email: string): string {
  return (email.split('@')[0]?.[0] ?? '?').toUpperCase()
}

export function RoleListClient() {
  const [roles, setRoles]         = useState<Role[]>([])
  const [users, setUsers]         = useState<UserRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/users'),
      ])
      if (!rolesRes.ok || !usersRes.ok) throw new Error('Failed to load')
      const rolesData = await rolesRes.json() as { roles: Role[] }
      const usersData = await usersRes.json() as { users: UserRow[] }
      setRoles(rolesData.roles)
      setUsers(usersData.users)
      if (rolesData.roles.length > 0) setSelectedId(rolesData.roles[0]!.id)
    } catch {
      setError('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleDelete() {
    if (!selectedId) return
    setDeleteError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/roles/${selectedId}`, { method: 'DELETE' })
      if (res.ok) {
        const remaining = roles.filter(r => r.id !== selectedId)
        setRoles(remaining)
        setSelectedId(remaining[0]?.id ?? null)
      } else {
        const body = await res.json() as { error?: string }
        setDeleteError(body.error === 'role_in_use'
          ? 'Remove all users from this role before deleting.'
          : 'Failed to delete role.')
      }
    } catch {
      setDeleteError('Failed to delete role.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  const selected = roles.find(r => r.id === selectedId) ?? null
  const members  = users.filter(u => u.roles.some(r => r.id === selectedId))

  return (
    <div>
      <PageHead
        title="Roles & permissions"
        sub={`${roles.length} role${roles.length === 1 ? '' : 's'} · ${PERMISSIONS.length} permission scopes`}
        actions={
          <Link href="/roles/new" className={styles.btnPrimary}>
            + New role
          </Link>
        }
      />

      <div className={styles.layout}>
        {/* Role list */}
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <h3>Roles</h3>
          </div>
          <div className={styles.flush}>
            {roles.length === 0 ? (
              <div className={styles.emptyState}>No roles yet.</div>
            ) : (
              roles.map((role, i) => {
                const hue = strHue(role.name, ROLE_HUES)
                return (
                  <div
                    key={role.id}
                    className={role.id === selectedId ? styles.roleItemActive : styles.roleItem}
                    onClick={() => { setSelectedId(role.id); setDeleteError(null) }}
                    style={{ borderBottom: i < roles.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className={styles.roleItemRow}>
                      <span className={styles.roleDot} style={{ background: `hsl(${hue} 55% 45%)` }} />
                      <strong>{role.name}</strong>
                      <span className={styles.roleMembers}>
                        {role.userCount} member{role.userCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className={styles.rolePerms}>
                      {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right panel */}
        {selected ? (
          <div className={styles.stack}>
            {/* Overview */}
            <div className={styles.card}>
              <div className={styles.cardHd}>
                <div className={styles.roleTitle}>
                  <span className={styles.roleDot} style={{ background: `hsl(${strHue(selected.name, ROLE_HUES)} 55% 45%)` }} />
                  <h3>{selected.name}</h3>
                </div>
                <div className={styles.cardActions}>
                  <Link href={`/roles/${selected.id}`} className={styles.btnSm}>Edit</Link>
                  <button
                    className={styles.btnSmDanger}
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                {deleteError && <p className={styles.deleteError} role="alert">{deleteError}</p>}
                <div className={styles.statsRow}>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Members</div>
                    <div className={styles.statValue}>{selected.userCount}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Permissions</div>
                    <div className={styles.statValue}>{selected.permissions.length}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Created</div>
                    <div className={styles.statValueSm}>{new Date(selected.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions matrix */}
            <div className={styles.card}>
              <div className={styles.cardHd}>
                <h3>Permissions</h3>
                <span className={styles.meta}>Compare across roles</span>
              </div>
              <div className={styles.matrixWrap}>
                <table className={styles.matrix}>
                  <thead>
                    <tr>
                      <th>Permission</th>
                      {roles.map(r => (
                        <th key={r.id} className={r.id === selectedId ? styles.matrixColActive : undefined}>
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map(perm => (
                      <tr key={perm}>
                        <td className={styles.permLabel}>{perm}</td>
                        {roles.map(r => (
                          <td key={r.id} className={styles.matrixCell}>
                            {r.permissions.includes(perm)
                              ? <span className={styles.tick}>✓</span>
                              : <span className={styles.dash}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Members */}
            <div className={styles.card}>
              <div className={styles.cardHd}>
                <h3>Members</h3>
                <span className={styles.meta}>{members.length} user{members.length === 1 ? '' : 's'}</span>
              </div>
              <div className={styles.flush}>
                {members.length === 0 ? (
                  <div className={styles.emptyState}>No members in this role yet.</div>
                ) : (
                  <table className={styles.memberTbl}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className={styles.userCell}>
                              <span
                                className={styles.avatar}
                                style={{ '--hue': strHue(u.email, AVATAR_HUES) } as React.CSSProperties}
                              >
                                {emailInitials(u.email)}
                              </span>
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td>
                            <Pill kind={u.status === 'active' ? 'good' : 'info'}>
                              {u.status === 'active' ? 'Active' : 'Invited'}
                            </Pill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyRight}>Select a role to view details.</div>
        )}
      </div>
    </div>
  )
}
