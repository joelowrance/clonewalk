// screens/roles.jsx

function RolesScreen() {
  const [active, setActive] = React.useState(SEED_ROLES[0].id);
  const role = SEED_ROLES.find(r => r.id === active);

  return (
    <div>
      <PageHead
        title="Roles & permissions"
        sub={`${SEED_ROLES.length} roles defining ${PERMS.length} permission scopes`}
        actions={
          <>
            <button className="btn">{ICONS.download} Export policy</button>
            <button className="btn primary">{ICONS.plus} New role</button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 14 }}>
        {/* Role list */}
        <div className="card">
          <div className="card-hd">
            <h3>Roles</h3>
            <span className="meta">{SEED_USERS.length} members</span>
          </div>
          <div className="card-body flush">
            {SEED_ROLES.map((r, i) => (
              <div key={r.id}
                   onClick={() => setActive(r.id)}
                   style={{
                     padding: '14px var(--pad)',
                     borderBottom: i < SEED_ROLES.length - 1 ? '1px solid var(--border)' : 'none',
                     background: active === r.id ? 'var(--accent-soft)' : 'transparent',
                     borderLeft: '3px solid ' + (active === r.id ? 'var(--accent)' : 'transparent'),
                     cursor: 'pointer',
                     transition: 'background .1s',
                   }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="row" style={{ gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 50, background: r.color }} />
                    <b style={{ fontSize: 13.5 }}>{r.name}</b>
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.members} member{r.members === 1 ? '' : 's'}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.desc}</div>
                <div style={{ marginTop: 6 }}>
                  <span className="tag">{r.scope}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="stack" style={{ gap: 14 }}>
          <div className="card">
            <div className="card-hd">
              <div>
                <h3 className="row" style={{ gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 50, background: role.color }} />
                  {role.name}
                </h3>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{role.desc}</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn sm">{ICONS.edit} Edit</button>
                <button className="btn sm">Duplicate</button>
              </div>
            </div>
            <div className="card-body">
              <div className="grid g4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                <Stat label="Members"    value={role.members} />
                <Stat label="Scope"      value={role.scope} mono={false} />
                <Stat label="Last edited" value="Apr 14, 2026" mono={false} />
                <Stat label="Inheritable" value={role.name === 'Lead Auditor' ? 'Yes' : 'No'} mono={false} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Permissions matrix</h3>
              <span className="meta">Compare across roles</span>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="matrix">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Permission</th>
                    {SEED_ROLES.map(r => (
                      <th key={r.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 50, background: r.color }} />
                          <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11, color: 'var(--ink-2)' }}>{r.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMS.map(p => (
                    <tr key={p.key}>
                      <td style={{ fontWeight: 500 }}>{p.key}</td>
                      {p.vals.map((v, i) => (
                        <td key={i}>
                          {v
                            ? <span className="tick">{ICONS.check}</span>
                            : <span className="dash">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Members in this role</h3>
              <button className="btn sm">{ICONS.plus} Assign user</button>
            </div>
            <div className="card-body flush">
              <table className="tbl">
                <thead>
                  <tr><th>Name</th><th className="tnum">Locations</th><th>Last active</th><th>Status</th><th style={{ width: 60 }}></th></tr>
                </thead>
                <tbody>
                  {SEED_USERS.filter(u => u.role === role.name).slice(0, 6).map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <Avatar initials={u.initials} hue={u.hue} size={26} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                            <span className="muted" style={{ fontSize: 11.5 }}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="tnum mono">{u.locations}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{u.last}</td>
                      <td><Pill kind={STATUS_TO_PILL[u.status]}>{u.status}</Pill></td>
                      <td><button className="btn sm ghost">Remove</button></td>
                    </tr>
                  ))}
                  {SEED_USERS.filter(u => u.role === role.name).length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No members in this role yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono = true }) {
  return (
    <div style={{ padding: '4px 0', borderRight: '1px solid var(--border)', paddingRight: 14, marginRight: 14 }}>
      <div className="eyebrow">{label}</div>
      <div style={{ fontFamily: mono ? 'var(--serif)' : 'var(--sans)', fontSize: mono ? 22 : 14, fontWeight: 500, marginTop: 4 }}>{value}</div>
    </div>
  );
}

window.RolesScreen = RolesScreen;
