import { useEffect, useState } from 'react';
import { AppShell, type AppRoute } from './layouts/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { LoginView } from './features/login/LoginView';
import { PlaceholderView } from './features/placeholder/PlaceholderView';
import { AccountView } from './features/account/AccountView';
import { SensorStatusView } from './features/sensor/SensorStatusView';
import { api, type User } from './mocks';
import type { DetailRoute } from './features/dashboard/tiles/types';

function App() {
  const [active, setActive] = useState<AppRoute>('home');
  const [detail, setDetail] = useState<DetailRoute | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    api.getCurrentUser()
      .then(u => { if (alive) setUser(u); })
      .finally(() => { if (alive) setBooting(false); });
    return () => { alive = false; };
  }, []);

  if (booting) {
    return (
      <div className="app__boot">
        <span>Ładowanie…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginView
        onLoggedIn={(u) => {
          setUser(u);
          setActive('home');
        }}
        onGoToRegister={() => console.info('Rejestracja: w przygotowaniu.')}
        onForgotPassword={() => console.info('Reset hasła: w przygotowaniu.')}
      />
    );
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
  }

  if (detail === 'sensor') {
    return (
      <AppShell active={active} onChange={(r) => { setActive(r); setDetail(null); }}>
        <SensorStatusView onBack={() => setDetail(null)} />
      </AppShell>
    );
  }

  const ctx = { user, onNavigate: (r: DetailRoute) => setDetail(r) };

  const content = (() => {
    switch (active) {
      case 'home':
        return <DashboardView ctx={ctx} />;
      case 'account':
        return <AccountView user={user} onLogout={handleLogout} />;
      case 'glycemia':
        return (
          <PlaceholderView
            icon="drop"
            title="Glikemia"
            description="Tu pojawi się historia pomiarów i analizy trendów."
          />
        );
      case 'meals':
        return (
          <PlaceholderView
            icon="fork"
            title="Posiłki"
            description="W przygotowaniu: planowanie posiłków i dawki insuliny."
          />
        );
      case 'insulin':
        return (
          <PlaceholderView
            icon="syringe"
            title="Insulina"
            description="Kalkulator bolusa i harmonogram podań."
          />
        );
      default:
        return <DashboardView ctx={ctx} />;
    }
  })();

  return (
    <AppShell active={active} onChange={setActive}>
      {content}
    </AppShell>
  );
}

export default App;