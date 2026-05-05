import { useEffect, useState } from 'react';
import { AppShell, type AppRoute } from './layouts/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { LoginView } from './features/login/LoginView';
import { PlaceholderView } from './features/placeholder/PlaceholderView';
import { AccountView } from './features/account/AccountView';
import { api, type User } from './mocks';

function App() {
  const [active, setActive] = useState<AppRoute>('home');
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

  const ctx = { user };

  const content = (() => {
    switch (active) {
      case 'home':
        return <DashboardView ctx={ctx} />;
      case 'account':
        return <AccountView user={user} />;
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