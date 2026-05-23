// screens/users.jsx

function UsersScreen() {
  const [q, setQ] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("All");
  const [sel, setSel] = React.useState(new Set());

  const roles = ["All", ...new Set(SEED_USERS.map(u => u.role))];
  const filtered = SEED_USERS.filter(u => {
    if (roleFilter !== "All" && u.role !== roleFilter) return false;
    if (q && !(u.name + " " + u.email).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const toggle = (id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const toggleAll = () => sel.size === filtered.length ? setSel(new Set()) : setSel(new Set(filtered.map(u => u.id)));

  const stats = {
    total: SEED_USERS.length,
    active: SEED_USERS.filter(u => u.status === "Active").length,
    invited: SEED_USERS.filter(u => u.status === "Invited").length,
    suspended: SEED_USERS.filter(u => u.status === "Suspended").length,
  };

  return (
    <div>
      <PageHead
        title="Users"
        sub={`${stats.total} accounts · ${stats.active} active · ${stats.invited} invited · ${stats.suspended} suspended`}
        actions={
          <>
            <button className="btn">{ICONS.download} Export</button>
            <button className="btn">SCIM sync {ICONS.external}</button>
            <button className="btn primary">{ICONS.plus} Invite user</button>
          </>
        }
      />

      <div className="card">
        <div className="tools-row">
          <div className="search">
            {ICONS.search}
            <input placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="seg">
            {roles.map(r => (
              <button key={r} className={roleFilter === r ? "active" : ""} onClick={() => setRoleFilter(r)}>{r}</button>
            ))}
          </div>
          <div className="spacer" />
          {sel.size > 0 ? (
            <>
              <span className="muted" style={{ fontSize: 12 }}>{sel.size} selected</span>
              <button className="btn sm">Change role</button>
              <button className="btn sm">Reassign locations</button>
              <button className="btn sm danger">Suspend</button>
            </>
          ) : (
            <span className="muted mono" style={{ fontSize: 11.5 }}>{filtered.length} of {SEED_USERS.length}</span>
          )}
        </div>
        <div className="no-scroll-x">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 28 }}><Checkbox checked={sel.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              <th>Name</th>
              <th>Role</th>
              <th className="tnum">Locations</th>
              <th>Status</th>
              <th>Last active</th>
              <th>MFA</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={sel.has(u.id) ? "selected" : ""}>
                <td onClick={e => e.stopPropagation()}><Checkbox checked={sel.has(u.id)} onChange={() => toggle(u.id)} /></td>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar initials={u.initials} hue={u.hue} size={28} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      <span className="muted" style={{ fontSize: 11.5 }}>{u.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="row" style={{ gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 50, background: SEED_ROLES.find(r => r.name === u.role)?.color || 'var(--muted)' }} />
                    {u.role}
                  </span>
                </td>
                <td className="tnum mono">{u.locations}</td>
                <td><Pill kind={STATUS_TO_PILL[u.status]}>{u.status}</Pill></td>
                <td className="muted" style={{ fontSize: 12 }}>{u.last}</td>
                <td>
                  {u.status === "Invited"
                    ? <span className="muted mono" style={{ fontSize: 11.5 }}>—</span>
                    : i % 7 === 0
                      ? <Pill kind="warn" dot={false}>Not set</Pill>
                      : <span className="row" style={{ gap: 4, fontSize: 11.5, color: 'var(--good)' }}>{ICONS.check}<span>App</span></span>}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn sm ghost" style={{ padding: '0 6px' }}>{ICONS.dots}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

window.UsersScreen = UsersScreen;
