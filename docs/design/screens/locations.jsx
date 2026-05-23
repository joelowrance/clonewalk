// screens/locations.jsx

function LocationsScreen({ onOpenDetail }) {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(new Set());
  const [statusFilter, setStatusFilter] = React.useState("All");

  const filtered = SEED_LOCATIONS.filter(l => {
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    if (q && !(l.name + " " + l.parent + " " + l.id).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const toggle = (id) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };
  const toggleAll = () => {
    if (sel.size === filtered.length) setSel(new Set());
    else setSel(new Set(filtered.map(l => l.id)));
  };

  return (
    <div>
      <PageHead
        title="Locations"
        sub={`${SEED_LOCATIONS.length} sites across 5 regions · ${SEED_LOCATIONS.filter(l => l.status === 'Compliant').length} fully compliant`}
        actions={
          <>
            <button className="btn">{ICONS.download} Export CSV</button>
            <button className="btn">{ICONS.filter} Filter</button>
            <button className="btn primary">{ICONS.plus} New location</button>
          </>
        }
      />

      <div className="card">
        <div className="tools-row">
          <div className="search">
            {ICONS.search}
            <input placeholder="Search by name, region, or ID…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="seg">
            {["All", "Compliant", "In Review", "At Risk", "Non-compliant"].map(s => (
              <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          <div className="spacer" />
          {sel.size > 0 ? (
            <>
              <span className="muted" style={{ fontSize: 12 }}>{sel.size} selected</span>
              <button className="btn sm">Reassign owner</button>
              <button className="btn sm">Schedule audit</button>
              <button className="btn sm danger">Archive</button>
            </>
          ) : (
            <span className="muted mono" style={{ fontSize: 11.5 }}>{filtered.length} of {SEED_LOCATIONS.length}</span>
          )}
        </div>
        <div className="no-scroll-x">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 28 }}><Checkbox checked={sel.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              <th style={{ width: 76 }}>ID</th>
              <th>Name</th>
              <th>Region · Type</th>
              <th>Status</th>
              <th>Compliance score</th>
              <th className="tnum">Open</th>
              <th>Owner</th>
              <th>Next audit</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className={sel.has(l.id) ? "selected" : ""} onClick={() => onOpenDetail(l.id)}>
                <td onClick={e => e.stopPropagation()}><Checkbox checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
                <td className="mono" style={{ color: 'var(--muted)' }}>{l.id}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                </td>
                <td>
                  {l.parent}
                  <span className="muted"> · {l.type}</span>
                </td>
                <td><Pill kind={STATUS_TO_PILL[l.status]}>{l.status}</Pill></td>
                <td><Score value={l.score} /></td>
                <td className="tnum">
                  {l.openFindings > 0
                    ? <span className={l.openFindings >= 6 ? "" : ""} style={{ color: l.openFindings >= 6 ? 'var(--bad)' : 'var(--ink)', fontFamily: 'var(--mono)' }}>{l.openFindings}</span>
                    : <span className="muted mono">—</span>}
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <Avatar initials={l.owner.split(' ').map(s => s[0]).join('')} hue={(l.owner.charCodeAt(0) % 36) * 10} size={22} />
                    <span>{l.owner.split(' ')[0]} {l.owner.split(' ')[1]?.[0]}.</span>
                  </div>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{l.nextAudit}</td>
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

function LocationDetailScreen({ id, onBack, onShowToast }) {
  const L = LOCATION_DETAIL;
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [name, setName] = React.useState(L.name);

  return (
    <div>
      <PageHead
        crumbs={<><a onClick={onBack}>Locations</a> <span style={{ margin: '0 6px', color: 'var(--faint)' }}>/</span> {L.parent} <span style={{ margin: '0 6px', color: 'var(--faint)' }}>/</span> <span style={{ color: 'var(--ink)' }}>{L.name}</span></>}
        title={
          <span className="row" style={{ gap: 12 }}>
            {L.name}
            <Pill kind={STATUS_TO_PILL[L.status]}>{L.status}</Pill>
            <span className="mono" style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--mono)', fontWeight: 400 }}>{L.id}</span>
          </span>
        }
        sub={L.address}
        actions={
          <>
            <button className="btn">{ICONS.download} Export</button>
            <button className="btn">{ICONS.edit} Edit</button>
            <button className="btn primary">{ICONS.plus} Schedule audit</button>
          </>
        }
      />

      {/* Metric strip */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="kpi-row">
          <div className="kpi">
            <div className="label">Compliance score</div>
            <div className="value tnum">{L.score}<span className="unit">/100</span></div>
            <div className="row" style={{ marginTop: 4 }}>
              <div className="bar good" style={{ height: 6 }}><i style={{ width: L.score + "%" }} /></div>
            </div>
          </div>
          <div className="kpi">
            <div className="label">Open findings</div>
            <div className="value tnum">{L.openFindings}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{L.closedYTD} closed YTD</div>
          </div>
          <div className="kpi">
            <div className="label">Last audit</div>
            <div className="value" style={{ fontSize: 20 }}>{L.lastAudit}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>by Amelia Whitcomb</div>
          </div>
          <div className="kpi">
            <div className="label">Next audit</div>
            <div className="value" style={{ fontSize: 20 }}>{L.nextAudit}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>in 20 days · Quarterly</div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="stack" style={{ gap: 14 }}>
          {/* Open findings */}
          <div className="card">
            <div className="card-hd">
              <h3>Open findings</h3>
              <div className="row" style={{ gap: 8 }}>
                <span className="meta">{L.findings.length} active</span>
                <button className="btn sm">{ICONS.plus} Add finding</button>
              </div>
            </div>
            <div className="card-body flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 76 }}>ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Opened</th>
                    <th>Due</th>
                    <th>Owner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {L.findings.map(f => {
                    const sev = f.severity === 'High' ? 'bad' : f.severity === 'Medium' ? 'warn' : 'good';
                    return (
                      <tr key={f.id}>
                        <td className="mono" style={{ color: 'var(--muted)' }}>{f.id}</td>
                        <td>{f.title}</td>
                        <td><Pill kind={sev}>{f.severity}</Pill></td>
                        <td className="mono" style={{ fontSize: 12 }}>{f.opened}</td>
                        <td className="mono" style={{ fontSize: 12 }}>{f.due}</td>
                        <td><Avatar initials={f.owner} hue={(f.owner.charCodeAt(0) - 65) * 19} size={22} /></td>
                        <td><Pill kind={f.status === 'Open' ? '' : 'info'}>{f.status}</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div className="card-hd">
              <h3>Audit history</h3>
              <button className="btn sm ghost">View full log {ICONS.chevron}</button>
            </div>
            <div className="card-body flush">
              <div className="timeline">
                {L.history.map((h, i) => (
                  <div key={i} className={"tl-row " + (h.tone || "")}>
                    <div className="when">{h.when}</div>
                    <div className="dot" />
                    <div className="what">
                      <span className="muted" style={{ marginRight: 8, fontSize: 11.5 }}>{h.who}</span>
                      {h.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          {/* Details */}
          <div className="card">
            <div className="card-hd"><h3>Details</h3></div>
            <div className="card-body">
              <div className="stack" style={{ gap: 8 }}>
                <DetailRow label="ID"        value={<span className="mono">{L.id}</span>} />
                <DetailRow label="Region"    value={L.parent} />
                <DetailRow label="Type"      value={L.type} />
                <DetailRow label="Owner"     value={<span className="row"><Avatar initials="PR" hue={280} size={20} />&nbsp;{L.owner}</span>} />
                <DetailRow label="Created"   value={L.created} />
                <div className="divider" />
                <DetailRow label="Floor area" value={<span className="mono">{L.sqft.toLocaleString()} ft²</span>} />
                <DetailRow label="Capacity"   value={<span className="mono">{L.capacity} staff</span>} />
                <DetailRow label="Zones"     value={
                  <div className="row wrap" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    {L.zones.map(z => <span key={z} className="tag">{z}</span>)}
                  </div>
                } />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <div className="card-hd">
              <h3>Documents</h3>
              <button className="btn sm ghost">{ICONS.plus} Upload</button>
            </div>
            <div className="card-body flush">
              {L.documents.map((d, i) => (
                <div key={i} className="row" style={{ padding: '10px var(--pad)', borderBottom: i < L.documents.length - 1 ? '1px solid var(--border)' : 'none', gap: 10 }}>
                  <div style={{ width: 22, height: 22, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 3, display: 'grid', placeItems: 'center', fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                    {d.name.split('.').pop().toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{d.size} · {d.by} · {d.at}</div>
                  </div>
                  <button className="btn sm ghost" style={{ padding: '0 6px' }}>{ICONS.download}</button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone — but make it tasteful */}
          <div className="card" style={{ borderColor: 'color-mix(in oklab, var(--bad), transparent 70%)' }}>
            <div className="card-hd"><h3>Manage</h3></div>
            <div className="card-body" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button className="btn" onClick={() => setEditing(true)}>{ICONS.edit} Edit location</button>
              <button className="btn danger" onClick={() => setConfirmingDelete(true)}>{ICONS.trash} Archive location</button>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <Modal
          title="Edit location"
          sub="Changes are versioned and require sign-off if status is Compliant."
          onClose={() => setEditing(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn primary" onClick={() => { setEditing(false); onShowToast("Location updated."); }}>Save changes</button>
          </>}
        >
          <div className="field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}><label>Region</label>
              <select defaultValue={L.parent}><option>Headquarters</option><option>North Region</option><option>South Region</option><option>Airfield Ops</option><option>R&D Campus</option></select>
            </div>
            <div className="field" style={{ flex: 1 }}><label>Type</label>
              <select defaultValue={L.type}><option>Production</option><option>Logistics</option><option>Storage</option><option>Office</option><option>Laboratory</option><option>Maintenance</option><option>Restricted</option></select>
            </div>
          </div>
          <div className="field"><label>Address</label><input defaultValue={L.address} /></div>
          <div className="field"><label>Notes</label><textarea rows="3" placeholder="Optional…" /></div>
        </Modal>
      )}

      {confirmingDelete && (
        <Modal
          title="Archive Main Floor?"
          sub="The location will be hidden from active audits and reports. Historical findings remain accessible."
          onClose={() => setConfirmingDelete(false)}
          footer={<>
            <button className="btn ghost" onClick={() => setConfirmingDelete(false)}>Cancel</button>
            <button className="btn danger" onClick={() => { setConfirmingDelete(false); onShowToast("Location archived."); }}>{ICONS.trash} Archive</button>
          </>}
        >
          <div className="row" style={{ gap: 12, padding: '6px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bad-soft)', color: 'var(--bad)', display: 'grid', placeItems: 'center', flex: '0 0 32px' }}>{ICONS.warn}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
              <b>3 open findings</b> will remain assigned to their owners. You can restore this location from the Archive within 30 days.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12.5 }}>
      <span className="muted" style={{ flex: '0 0 90px' }}>{label}</span>
      <span style={{ textAlign: 'right', flex: 1 }}>{value}</span>
    </div>
  );
}

Object.assign(window, { LocationsScreen, LocationDetailScreen });
