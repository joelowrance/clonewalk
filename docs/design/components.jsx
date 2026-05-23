// components.jsx — shared chrome and primitives

const { useState, useEffect, useRef } = React;

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
  { id: "locations", label: "Locations", icon: ICONS.locations, count: SEED_LOCATIONS.length },
  { id: "users",     label: "Users",     icon: ICONS.users,     count: SEED_USERS.length },
  { id: "roles",     label: "Roles",     icon: ICONS.roles,     count: SEED_ROLES.length },
];
const NAV_SECONDARY = [
  { id: "audits",    label: "Audits",    icon: ICONS.audits },
  { id: "reports",   label: "Reports",   icon: ICONS.reports },
  { id: "settings",  label: "Settings",  icon: ICONS.settings },
];

function Topbar({ env, onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">N</span>
        <span>Northgrove<span style={{ opacity: .55, fontWeight: 400 }}> · Compliance</span></span>
      </div>
      <div className="tb-search">
        {ICONS.search}
        <span>Search locations, users, findings, policies…</span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="tb-right">
        <div className="tb-env"><span className="dot" /> production · us-east</div>
        <button className="tb-icon" title="Notifications">{ICONS.bell}</button>
        <button className="tb-icon" title="Help">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M6 6.2a2 2 0 1 1 3 1.6c-.6.3-1 .7-1 1.5M8 12v.5" strokeLinecap="round"/></svg>
        </button>
        <div className="tb-avatar">AW</div>
      </div>
    </header>
  );
}

function Sidebar({ active, onNav, mode }) {
  if (mode === "top") return null;
  return (
    <aside className="sidebar">
      <div className="sb-section"><span>Workspace</span></div>
      {NAV.map(n => (
        <div key={n.id}
             className={"sb-item " + (active === n.id ? "active" : "")}
             onClick={() => onNav(n.id)}
             title={mode === "collapsed" ? n.label : undefined}>
          {n.icon}
          <span className="label">{n.label}</span>
          {n.count != null && <span className="count">{n.count}</span>}
        </div>
      ))}
      <div className="sb-section"><span>Programs</span></div>
      {NAV_SECONDARY.map(n => (
        <div key={n.id} className="sb-item" title={mode === "collapsed" ? n.label : undefined}>
          {n.icon}
          <span className="label">{n.label}</span>
        </div>
      ))}
      <div className="sb-foot">
        <div className="avatar">AW</div>
        <div className="who"><b>Amelia Whitcomb</b><span>Lead Auditor</span></div>
        <div className="caret">{ICONS.caret}</div>
      </div>
    </aside>
  );
}

function TopNav({ active, onNav }) {
  const all = [...NAV, ...NAV_SECONDARY];
  return (
    <nav className="topnav">
      {all.map(n => (
        <a key={n.id} className={active === n.id ? "active" : ""} onClick={() => onNav(n.id)}>
          {n.label}
          {n.count != null && <span className="badge">· {n.count}</span>}
        </a>
      ))}
    </nav>
  );
}

function PageHead({ crumbs, title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        {crumbs && <div className="crumbs">{crumbs}</div>}
        <h1 className="serif">{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="page-actions">{actions}</div>
    </div>
  );
}

function Pill({ kind, children, dot }) {
  return (
    <span className={"pill " + (kind || "")}>
      {dot !== false && <span className="dot" />}
      {children}
    </span>
  );
}

function Avatar({ initials, hue = 220, size = 26 }) {
  const bg = `oklch(58% 0.12 ${hue})`;
  return (
    <span className="av" style={{
      width: size, height: size,
      borderRadius: '50%',
      background: bg, color: '#fff',
      fontSize: size <= 22 ? 9.5 : 11,
      fontWeight: 600, display: 'inline-grid', placeItems: 'center'
    }}>{initials}</span>
  );
}

function AvatarStack({ items, max = 4 }) {
  const shown = items.slice(0, max);
  const more = items.length - shown.length;
  return (
    <span className="avatars">
      {shown.map((u, i) => (
        <span key={i} className="av" style={{ background: `oklch(58% 0.12 ${u.hue})` }}>{u.initials}</span>
      ))}
      {more > 0 && <span className="av more">+{more}</span>}
    </span>
  );
}

function Score({ value }) {
  const tone = value >= 90 ? "good" : value >= 75 ? "" : value >= 60 ? "warn" : "bad";
  return (
    <div className="score-cell">
      <div className={"bar " + tone}><i style={{ width: value + "%" }} /></div>
      <span className="num">{value}</span>
    </div>
  );
}

function Sparkline({ data, w = 130, h = 32, stroke = "var(--accent)", fill = true }) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y];
  });
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = d + ` L ${w - 1},${h - 1} L 1,${h - 1} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      {fill && <path d={area} fill={stroke} opacity=".12" />}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  );
}

function BarsHorizontal({ data }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="stack" style={{ gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} className="row" style={{ gap: 10 }}>
          <span style={{ width: 70, fontSize: 12, color: 'var(--ink-2)' }}>{d.label}</span>
          <div className={"bar " + d.tone} style={{ height: 8 }}>
            <i style={{ width: ((d.count / max) * 100) + "%" }} />
          </div>
          <span className="mono tnum" style={{ width: 28, textAlign: 'right', fontSize: 12 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, sub, children, onClose, footer }) {
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <h2 className="serif">{title}</h2>
          {sub && <div className="sub">{sub}</div>}
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  );
}

function Toast({ children, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);
  return <div className="toast">{ICONS.check} {children}</div>;
}

function Checkbox({ checked, onChange }) {
  return <span className={"checkbox " + (checked ? "on" : "")} onClick={(e) => { e.stopPropagation(); onChange(!checked); }} />;
}

Object.assign(window, {
  NAV, NAV_SECONDARY,
  Topbar, Sidebar, TopNav,
  PageHead, Pill, Avatar, AvatarStack, Score, Sparkline, BarsHorizontal,
  Modal, Toast, Checkbox,
});
