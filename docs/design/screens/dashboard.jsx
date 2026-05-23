// screens/dashboard.jsx

function DashboardScreen({ onNav }) {
  return (
    <div>
      <PageHead
        title="Compliance overview"
        sub="Across 5 regions and 27 active locations · Updated 2 minutes ago"
        actions={
          <>
            <div className="seg">
              <button className="active">30d</button>
              <button>90d</button>
              <button>YTD</button>
              <button>12m</button>
            </div>
            <button className="btn">{ICONS.download} Export</button>
            <button className="btn primary">{ICONS.plus} New audit</button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="kpi-row">
          <div className="kpi">
            <div className="label">Compliance score</div>
            <div className="value tnum">86<span className="unit">/100</span></div>
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <span className="delta up">▲ 2.4</span>
              <Sparkline data={COMPLIANCE_TREND} w={110} h={26} />
            </div>
          </div>
          <div className="kpi">
            <div className="label">Open findings</div>
            <div className="value tnum">38</div>
            <div className="row" style={{ gap: 6, marginTop: 4 }}>
              <span className="tag" style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}>2 critical</span>
              <span className="tag" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>7 high</span>
              <span className="tag">29 lower</span>
            </div>
          </div>
          <div className="kpi">
            <div className="label">Audits this month</div>
            <div className="value tnum">14<span className="unit"> / 18</span></div>
            <div className="row" style={{ gap: 8, marginTop: 6 }}>
              <div className="bar good" style={{ height: 6, maxWidth: 130 }}><i style={{ width: '78%' }} /></div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>78%</span>
            </div>
          </div>
          <div className="kpi">
            <div className="label">Locations at risk</div>
            <div className="value tnum">3</div>
            <div className="row" style={{ gap: 4, marginTop: 4 }}>
              <Pill kind="warn">2 At Risk</Pill>
              <Pill kind="bad">1 Non-compliant</Pill>
            </div>
          </div>
        </div>
      </div>

      <div className="grid g3" style={{ gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Upcoming audits */}
        <div className="card">
          <div className="card-hd">
            <h3>Upcoming audits</h3>
            <div className="row" style={{ gap: 8 }}>
              <span className="meta">Next 30 days</span>
              <button className="btn sm ghost">View all {ICONS.chevron}</button>
            </div>
          </div>
          <div className="card-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>ID</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th className="tnum">Date</th>
                  <th className="tnum">Days</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {UPCOMING_AUDITS.map(a => (
                  <tr key={a.id}>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{a.id}</td>
                    <td><b>{a.loc}</b></td>
                    <td>{a.type}</td>
                    <td><Avatar initials={a.assigned} hue={(a.assigned.charCodeAt(0) - 65) * 19} size={22} /></td>
                    <td className="tnum">{a.date}</td>
                    <td className="tnum mono">{a.daysLeft}d</td>
                    <td>
                      {a.risk === 'high' && <Pill kind="bad">High</Pill>}
                      {a.risk === 'med' && <Pill kind="warn">Medium</Pill>}
                      {a.risk === 'low' && <Pill kind="good">Low</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Findings breakdown */}
        <div className="stack" style={{ gap: 14 }}>
          <div className="card">
            <div className="card-hd">
              <h3>Findings by severity</h3>
              <span className="meta">Open · YTD</span>
            </div>
            <div className="card-body">
              <BarsHorizontal data={FINDINGS_BARS} />
              <div className="divider" />
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
                <span className="muted">Mean time to close</span>
                <span className="mono">11.4 days</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span className="muted">Re-opened (90d)</span>
                <span className="mono">2</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Region scorecard</h3>
              <span className="meta">Weighted</span>
            </div>
            <div className="card-body">
              <div className="heat">
                {HEATMAP.map(h => {
                  const tone = h.score >= 90 ? "good" : h.score >= 75 ? "" : h.score >= 60 ? "warn" : "bad";
                  return (
                    <div className="row" key={h.name}>
                      <span className="name" style={{ width: 130, fontSize: 12 }}>{h.name}<span className="muted"> · {h.of}</span></span>
                      <div className={"bar " + tone} style={{ height: 8 }}>
                        <i style={{ width: h.score + "%" }} />
                      </div>
                      <span className="num mono" style={{ width: 36, textAlign: 'right', fontSize: 11.5 }}>{h.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-hd">
          <h3>Recent activity</h3>
          <div className="row" style={{ gap: 10 }}>
            <span className="meta">All events</span>
            <button className="btn sm ghost">{ICONS.filter} Filter</button>
          </div>
        </div>
        <div className="card-body flush">
          <div className="timeline">
            {ACTIVITY.map((a, i) => (
              <div key={i} className={"tl-row " + (a.tone || "")}>
                <div className="when">{a.date} · {a.when}</div>
                <div className="dot" />
                <div className="what">
                  <span className="muted" style={{ marginRight: 8, fontSize: 11.5 }}>{a.who}</span>
                  {a.what}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
