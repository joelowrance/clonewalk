// app.jsx — main application

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#2c5fd6",
  "density": "balanced",
  "font": "editorial",
  "sidebar": "expanded"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = [
  { name: "Indigo",   light: "#2c5fd6", lightSoft: "#e6ecfb", lightInk: "#1c3f96", dark: "#6e96ff", darkSoft: "#1d2a4f", darkInk: "#b6c8ff" },
  { name: "Forest",   light: "#2e7d50", lightSoft: "#dcefe1", lightInk: "#1d5236", dark: "#5cc189", darkSoft: "#1c3a29", darkInk: "#b6e6c8" },
  { name: "Ember",    light: "#b45309", lightSoft: "#f6e8cf", lightInk: "#7a3a06", dark: "#e0a44b", darkSoft: "#3c2d12", darkInk: "#f0c98c" },
  { name: "Plum",     light: "#7c3aed", lightSoft: "#ece2fb", lightInk: "#552597", dark: "#a78bfa", darkSoft: "#2e1f4c", darkInk: "#cdb9fd" },
  { name: "Slate",    light: "#1f2937", lightSoft: "#e2e5eb", lightInk: "#0f172a", dark: "#9aa6bb", darkSoft: "#262a34", darkInk: "#d4dae5" },
];

function applyAccent(hex, dark) {
  const preset = ACCENT_PRESETS.find(p => p.light === hex) || ACCENT_PRESETS[0];
  const root = document.documentElement;
  if (dark) {
    root.style.setProperty('--accent',      preset.dark);
    root.style.setProperty('--accent-soft', preset.darkSoft);
    root.style.setProperty('--accent-ink',  preset.darkInk);
  } else {
    root.style.setProperty('--accent',      preset.light);
    root.style.setProperty('--accent-soft', preset.lightSoft);
    root.style.setProperty('--accent-ink',  preset.lightInk);
  }
}

const DENSITY_MAP = { compact: "compact", balanced: "balanced", comfy: "comfy" };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState("dashboard");
  const [openLocId, setOpenLocId] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-density', t.density);
    document.documentElement.setAttribute('data-font', t.font);
    document.documentElement.setAttribute('data-sidebar', t.sidebar);
    applyAccent(t.accent, t.dark);
  }, [t.dark, t.density, t.font, t.sidebar, t.accent]);

  const handleNav = (id) => {
    setOpenLocId(null);
    setScreen(id);
  };

  const renderScreen = () => {
    if (screen === "locations" && openLocId) {
      return <LocationDetailScreen id={openLocId} onBack={() => setOpenLocId(null)} onShowToast={(m) => setToast(m)} />;
    }
    switch (screen) {
      case "dashboard": return <DashboardScreen onNav={handleNav} />;
      case "locations": return <LocationsScreen onOpenDetail={(id) => setOpenLocId(id)} />;
      case "users":     return <UsersScreen />;
      case "roles":     return <RolesScreen />;
      default:
        return (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <h2 className="serif">Coming up next</h2>
            <p className="muted" style={{ marginTop: 6 }}>This area of the prototype isn't built out yet.</p>
            <div style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={() => handleNav("dashboard")}>Back to dashboard</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <Topbar />
      {t.sidebar === "top" && <TopNav active={screen} onNav={handleNav} />}
      <div className="shell">
        <Sidebar active={screen} onNav={handleNav} mode={t.sidebar} />
        <main className="main">
          {renderScreen()}
        </main>
      </div>

      {toast && <Toast onDone={() => setToast(null)}>{toast}</Toast>}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakColor   label="Accent color" value={t.accent}
                      options={ACCENT_PRESETS.map(p => p.light)}
                      onChange={(v) => setTweak('accent', v)} />

        <TweakSection label="Layout" />
        <TweakRadio   label="Density"  value={t.density}
                      options={['compact', 'balanced', 'comfy']}
                      onChange={(v) => setTweak('density', v)} />
        <TweakSelect  label="Sidebar"  value={t.sidebar}
                      options={[
                        { value: 'expanded',  label: 'Expanded · with labels' },
                        { value: 'collapsed', label: 'Collapsed · icons only' },
                        { value: 'top',       label: 'Top nav · no sidebar' },
                      ]}
                      onChange={(v) => setTweak('sidebar', v)} />

        <TweakSection label="Typography" />
        <TweakSelect  label="Font pairing" value={t.font}
                      options={[
                        { value: 'editorial',  label: 'Editorial · Newsreader + Geist' },
                        { value: 'enterprise', label: 'Enterprise · IBM Plex' },
                        { value: 'classic',    label: 'Classic · Lora + Manrope' },
                      ]}
                      onChange={(v) => setTweak('font', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
