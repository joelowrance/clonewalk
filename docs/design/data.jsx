// data.jsx — seed data for the prototype

const ICONS = {
  dashboard: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="2" width="5.5" height="5.5" rx="1"/><rect x="2" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/></svg>,
  audits: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 2.5h6L12.5 5.5v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z"/><path d="M9 2.5v3h3.5M5 8.5l1.5 1.5L9.5 7"/></svg>,
  locations: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14.5s5-4.5 5-8.5a5 5 0 1 0-10 0c0 4 5 8.5 5 8.5Z"/><circle cx="8" cy="6" r="2"/></svg>,
  users: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="2.5"/><path d="M1.5 13.5c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4"/><circle cx="11.5" cy="5" r="2"/><path d="M10 13.5c0-1.5.6-2.8 1.6-3.5 2 .2 3.4 1.7 3.4 3.5"/></svg>,
  roles: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5 13 4v4c0 3-2.2 5.5-5 6.5-2.8-1-5-3.5-5-6.5V4l5-2.5Z"/><path d="m5.8 8 1.6 1.6L10.5 6.5"/></svg>,
  reports: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 13.5V6M6 13.5V3M9.5 13.5V8M13 13.5V5"/></svg>,
  settings: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2"/><path d="M13.4 9.4a5.5 5.5 0 0 0 0-2.8l1.4-1-1.5-2.6-1.6.7a5.5 5.5 0 0 0-2.4-1.4L9 .5H6l-.3 1.8a5.5 5.5 0 0 0-2.4 1.4l-1.6-.7L.2 5.6l1.4 1a5.5 5.5 0 0 0 0 2.8l-1.4 1 1.5 2.6 1.6-.7a5.5 5.5 0 0 0 2.4 1.4L6 15.5h3l.3-1.8a5.5 5.5 0 0 0 2.4-1.4l1.6.7 1.5-2.6-1.4-1Z"/></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="m13.5 13.5-3-3"/></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3.5v9M3.5 8h9"/></svg>,
  filter: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 3.5h11l-4 5v4l-3 1.5v-5.5l-4-5Z"/></svg>,
  download: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2.5v8m-3-3 3 3 3-3M2.5 13.5h11"/></svg>,
  bell: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.5 11.5h9l-1.2-1.5V6.5a3.3 3.3 0 0 0-6.6 0V10l-1.2 1.5Z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>,
  chevron: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 4 4 4-4 4"/></svg>,
  caret: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4"/></svg>,
  back: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4 6 8l4 4"/></svg>,
  edit: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2.5 13.5 5 5 13.5H2.5V11L11 2.5Z"/></svg>,
  trash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4 4.5l.6 8.4a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4.5"/></svg>,
  dots: <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="12.5" cy="8" r="1.2"/></svg>,
  external: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h4v4M13 3 7 9M7 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"/></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m3.5 8.5 3 3 6-7"/></svg>,
  clock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/></svg>,
  warn: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2 14.5 13.5h-13L8 2Z"/><path d="M8 6.5v3M8 11.5v.5" strokeLinecap="round"/></svg>,
  pin: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 9v5.5M5 5l3-3 6 6-3 3-1.5-.5L8 13l-2.5-2.5L7 9.5 6.5 8 5 5Z"/></svg>,
};

const SEED_USERS = [
  { id: "u-001", name: "Amelia Whitcomb", email: "amelia.w@northgrove.co", role: "Lead Auditor", locations: 4, status: "Active", last: "12 min ago", initials: "AW", hue: 12 },
  { id: "u-002", name: "Devon Park", email: "devon.p@northgrove.co", role: "Compliance Officer", locations: 7, status: "Active", last: "1h ago", initials: "DP", hue: 220 },
  { id: "u-003", name: "Marcus Lindqvist", email: "marcus.l@northgrove.co", role: "Auditor", locations: 3, status: "Active", last: "Yesterday", initials: "ML", hue: 152 },
  { id: "u-004", name: "Priya Raman", email: "priya.r@northgrove.co", role: "Site Manager", locations: 1, status: "Active", last: "3h ago", initials: "PR", hue: 280 },
  { id: "u-005", name: "Hannah Yoon", email: "hannah.y@northgrove.co", role: "Auditor", locations: 2, status: "Invited", last: "—", initials: "HY", hue: 38 },
  { id: "u-006", name: "Jorge Castellanos", email: "jorge.c@northgrove.co", role: "Site Manager", locations: 1, status: "Active", last: "2d ago", initials: "JC", hue: 340 },
  { id: "u-007", name: "Naveen Mehta", email: "naveen.m@northgrove.co", role: "Compliance Officer", locations: 5, status: "Active", last: "4h ago", initials: "NM", hue: 195 },
  { id: "u-008", name: "Rosa Linden", email: "rosa.l@northgrove.co", role: "Read-only", locations: 12, status: "Active", last: "30 min ago", initials: "RL", hue: 78 },
  { id: "u-009", name: "Theo Brandt", email: "theo.b@northgrove.co", role: "Auditor", locations: 2, status: "Suspended", last: "11d ago", initials: "TB", hue: 4 },
  { id: "u-010", name: "Sumi Okafor", email: "sumi.o@northgrove.co", role: "Lead Auditor", locations: 6, status: "Active", last: "Just now", initials: "SO", hue: 168 },
  { id: "u-011", name: "Beatrice Mahon", email: "beatrice.m@northgrove.co", role: "Auditor", locations: 3, status: "Active", last: "5h ago", initials: "BM", hue: 305 },
  { id: "u-012", name: "Karim Solberg", email: "karim.s@northgrove.co", role: "Site Manager", locations: 2, status: "Active", last: "Yesterday", initials: "KS", hue: 240 },
];

const SEED_ROLES = [
  { id: "r-1", name: "Lead Auditor", members: 2, scope: "Org-wide", desc: "Plans audit programs, signs off on findings.", color: "var(--accent)" },
  { id: "r-2", name: "Compliance Officer", members: 2, scope: "Org-wide", desc: "Owns policy, evidence library, and reporting.", color: "var(--good)" },
  { id: "r-3", name: "Auditor", members: 4, scope: "Assigned locations", desc: "Executes audit cycles and records findings.", color: "var(--warn)" },
  { id: "r-4", name: "Site Manager", members: 3, scope: "Single location", desc: "Responds to findings and uploads remediation evidence.", color: "var(--bad)" },
  { id: "r-5", name: "Read-only", members: 1, scope: "Org-wide", desc: "Views dashboards and exports. No write access.", color: "var(--faint)" },
];

const PERMS = [
  { key: "View locations",     vals: [true, true, true, true, true] },
  { key: "Edit locations",     vals: [true, true, false, true, false] },
  { key: "Run audits",         vals: [true, true, true, false, false] },
  { key: "Sign-off findings",  vals: [true, true, false, false, false] },
  { key: "Manage users",       vals: [false, true, false, false, false] },
  { key: "Export reports",     vals: [true, true, true, true, true] },
  { key: "API access",         vals: [false, true, false, false, false] },
];

const SEED_LOCATIONS = [
  { id: "L-014", name: "Main Floor",          parent: "Headquarters",     type: "Production",  status: "In Review",   score: 86, openFindings: 3, lastAudit: "2026-04-28", nextAudit: "2026-06-12", owner: "Priya Raman",      created: "2024-03-12" },
  { id: "L-002", name: "Loading Dock A",      parent: "Headquarters",     type: "Logistics",   status: "Compliant",   score: 94, openFindings: 0, lastAudit: "2026-05-09", nextAudit: "2026-08-09", owner: "Jorge Castellanos", created: "2024-01-22" },
  { id: "L-003", name: "Cold Storage 2",      parent: "Headquarters",     type: "Storage",     status: "At Risk",     score: 68, openFindings: 7, lastAudit: "2026-04-02", nextAudit: "2026-05-25", owner: "Karim Solberg",    created: "2023-11-08" },
  { id: "L-008", name: "Riverside Annex",     parent: "North Region",     type: "Office",      status: "Compliant",   score: 91, openFindings: 1, lastAudit: "2026-05-15", nextAudit: "2026-08-15", owner: "Priya Raman",      created: "2024-08-30" },
  { id: "L-019", name: "Hangar 4",            parent: "Airfield Ops",     type: "Maintenance", status: "Non-compliant", score: 51, openFindings: 12, lastAudit: "2026-03-21", nextAudit: "2026-05-30", owner: "Jorge Castellanos", created: "2023-06-04" },
  { id: "L-021", name: "Lab West",            parent: "R&D Campus",       type: "Laboratory",  status: "Compliant",   score: 97, openFindings: 0, lastAudit: "2026-05-18", nextAudit: "2026-11-18", owner: "Priya Raman",      created: "2024-02-14" },
  { id: "L-022", name: "Lab East",            parent: "R&D Campus",       type: "Laboratory",  status: "In Review",   score: 82, openFindings: 4, lastAudit: "2026-05-02", nextAudit: "2026-06-20", owner: "Karim Solberg",    created: "2024-02-14" },
  { id: "L-027", name: "Distribution Hub 7",  parent: "South Region",     type: "Logistics",   status: "Compliant",   score: 89, openFindings: 2, lastAudit: "2026-05-11", nextAudit: "2026-08-11", owner: "Jorge Castellanos", created: "2023-09-19" },
  { id: "L-031", name: "Server Vault",        parent: "Headquarters",     type: "Restricted",  status: "Compliant",   score: 99, openFindings: 0, lastAudit: "2026-05-20", nextAudit: "2026-11-20", owner: "Priya Raman",      created: "2024-04-01" },
  { id: "L-033", name: "Plant Floor B",       parent: "North Region",     type: "Production",  status: "At Risk",     score: 72, openFindings: 6, lastAudit: "2026-04-18", nextAudit: "2026-06-02", owner: "Karim Solberg",    created: "2023-12-11" },
];

const STATUS_TO_PILL = {
  "Compliant":     "good",
  "In Review":     "info",
  "At Risk":       "warn",
  "Non-compliant": "bad",
  "Active":        "good",
  "Invited":       "info",
  "Suspended":     "bad",
};

const ACTIVITY = [
  { when: "10:42",  date: "Today",     who: "Amelia W.", tone: "good", what: <span><b>Sign-off issued</b> on Lab West audit cycle Q2.<div className="sub">3 findings closed • signed digitally</div></span> },
  { when: "09:18",  date: "Today",     who: "Sumi O.",   tone: "warn", what: <span>New finding <b>F-2104</b> on Cold Storage 2: temperature log gap on 5/20.<div className="sub">Severity: Medium • Assigned to Karim S.</div></span> },
  { when: "08:55",  date: "Today",     who: "Devon P.",  tone: "",     what: <span><b>Policy update</b> published: <i>Hazardous Materials v3.2</i>.<div className="sub">Notified 11 site managers</div></span> },
  { when: "17:30",  date: "Yesterday", who: "Naveen M.", tone: "bad",  what: <span>Audit on <b>Hangar 4</b> moved to Non-compliant.<div className="sub">12 open findings • escalated to Lead Auditor</div></span> },
  { when: "14:02",  date: "Yesterday", who: "Rosa L.",   tone: "",     what: <span>Exported quarterly compliance report (Q2-2026).<div className="sub">CSV • 4.1 MB • shared with leadership@</div></span> },
  { when: "11:25",  date: "Yesterday", who: "Marcus L.", tone: "good", what: <span>Evidence uploaded for <b>F-2087</b>: PPE training records.<div className="sub">12 documents • awaiting review</div></span> },
];

const UPCOMING_AUDITS = [
  { id: "A-441", loc: "Cold Storage 2",     type: "Quarterly", date: "May 25",     daysLeft: 2,  assigned: "AW", risk: "high" },
  { id: "A-442", loc: "Hangar 4",           type: "Re-audit",  date: "May 30",     daysLeft: 7,  assigned: "SO", risk: "high" },
  { id: "A-443", loc: "Main Floor",        type: "Quarterly",  date: "Jun 12",     daysLeft: 20, assigned: "AW", risk: "med" },
  { id: "A-444", loc: "Plant Floor B",      type: "Quarterly", date: "Jun 02",     daysLeft: 10, assigned: "ML", risk: "med" },
  { id: "A-445", loc: "Lab East",           type: "Spot",      date: "Jun 20",     daysLeft: 28, assigned: "BM", risk: "low" },
  { id: "A-446", loc: "Loading Dock A",     type: "Annual",    date: "Aug 09",     daysLeft: 78, assigned: "ML", risk: "low" },
];

// 12-month sparkline data: compliance score trend
const COMPLIANCE_TREND = [82, 79, 81, 78, 80, 84, 85, 83, 86, 88, 87, 86];
const FINDINGS_BARS = [
  { label: "Low",      count: 42, tone: "good" },
  { label: "Medium",   count: 18, tone: "warn" },
  { label: "High",     count: 7,  tone: "bad"  },
  { label: "Critical", count: 2,  tone: "bad"  },
];

const HEATMAP = [
  { name: "Headquarters",    score: 88, of: 4 },
  { name: "North Region",    score: 81, of: 3 },
  { name: "South Region",    score: 89, of: 2 },
  { name: "Airfield Ops",    score: 51, of: 1 },
  { name: "R&D Campus",      score: 90, of: 2 },
];

const LOCATION_DETAIL = {
  id: "L-014",
  name: "Main Floor",
  parent: "Headquarters",
  address: "210 Northgrove Way, Building A, Floor 1",
  type: "Production",
  status: "In Review",
  score: 86,
  openFindings: 3,
  closedYTD: 14,
  lastAudit: "Apr 28, 2026",
  nextAudit: "Jun 12, 2026",
  owner: "Priya Raman",
  created: "Mar 12, 2024",
  sqft: 14200,
  capacity: 84,
  zones: ["Assembly A", "Assembly B", "QA Bay", "Packing Line"],
  findings: [
    { id: "F-2104", severity: "Medium", title: "PPE storage cabinet partially unlocked", opened: "May 20", due: "Jun 03", owner: "PR", status: "Open" },
    { id: "F-2099", severity: "Low",    title: "Eyewash signage missing on west pillar",  opened: "May 12", due: "May 26", owner: "PR", status: "In progress" },
    { id: "F-2081", severity: "High",   title: "Forklift inspection log gap (5/2–5/6)",   opened: "May 06", due: "May 22", owner: "JC", status: "Open" },
  ],
  history: [
    { when: "Apr 28",  who: "Amelia W.", text: "Quarterly audit completed. Score 86 (▲ from 82). 3 findings opened, 5 closed.", tone: "good" },
    { when: "Apr 14",  who: "Marcus L.", text: "Spot inspection. Evidence uploaded.", tone: "" },
    { when: "Mar 03",  who: "Devon P.",  text: "Policy mapping refreshed to Hazardous Materials v3.1.", tone: "" },
    { when: "Feb 09",  who: "Amelia W.", text: "Quarterly audit completed. Score 82.", tone: "" },
    { when: "Jan 18",  who: "Priya R.",  text: "Ownership transferred from J. Castellanos to P. Raman.", tone: "" },
  ],
  documents: [
    { name: "Floor Plan — Main A.pdf",       size: "1.2 MB",  by: "Priya R.", at: "Mar 2024" },
    { name: "PPE Roster Q2.xlsx",            size: "44 KB",   by: "Hannah Y.", at: "Apr 2026" },
    { name: "Emergency Response v3.docx",    size: "208 KB",  by: "Devon P.",  at: "Mar 2026" },
    { name: "Equipment Maintenance Log.csv", size: "3.7 MB",  by: "Marcus L.", at: "May 2026" },
  ],
};

Object.assign(window, {
  ICONS, SEED_USERS, SEED_ROLES, PERMS, SEED_LOCATIONS, STATUS_TO_PILL,
  ACTIVITY, UPCOMING_AUDITS, COMPLIANCE_TREND, FINDINGS_BARS, HEATMAP, LOCATION_DETAIL,
});
