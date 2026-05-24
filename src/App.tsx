import { useEffect, useState } from 'react';
import { AppShell, type AppRoute } from './layouts/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { LoginView } from './features/login/LoginView';
import { PlaceholderView } from './features/placeholder/PlaceholderView';
import { AccountView } from './features/account/AccountView';
import { SensorStatusView } from './features/sensor/SensorStatusView';
import { GlycemiaTargetEditView } from './features/account/GlycemiaTargetEditView';
import { PrivacyView } from './features/account/PrivacyView';
import { GlycemiaView } from './features/glycemia/GlycemiaView';
import { ReportsView } from './features/reports/ReportsView';
import { RegisterView } from './features/login/RegisterView';
import { ForgotPasswordView } from './features/login/ForgotPasswordView';
import type { User } from './mocks';
import { firebaseLogout, onAuthChanged } from './lib/auth';
import type { DetailRoute } from './features/dashboard/tiles/types';

function App() {
  const [active, setActive] = useState<AppRoute>('home');
  const [detail, setDetail] = useState<DetailRoute | null>(null);
  const [glycemiaView, setGlycemiaView] = useState<'main' | 'reports'>('main');
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'forgot'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChanged(u => {
      setUser(u);
      setBooting(false);
    });
    return unsubscribe;
  }, []);

  if (booting) {
    return (
      <div className="app__boot">
        <span>Ładowanie…</span>
      </div>
    );
  }

  if (!user) {
    if (authScreen === 'register') {
      return (
        <RegisterView
          onRegistered={(u) => { setUser(u); setActive('home'); setAuthScreen('login'); }}
          onGoToLogin={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'forgot') {
      return (
        <ForgotPasswordView
          onGoToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginView
        onLoggedIn={(u) => { setUser(u); setActive('home'); }}
        onGoToRegister={() => setAuthScreen('register')}
        onForgotPassword={() => setAuthScreen('forgot')}
      />
    );
  }

  async function handleLogout() {
    await firebaseLogout();
  }

  if (detail === 'sensor') {
    return (
      <AppShell active={active} onChange={(r) => { setActive(r); setDetail(null); }}>
        <SensorStatusView onBack={() => setDetail(null)} />
      </AppShell>
    );
  }

  if (detail === 'edit-target') {
    return (
      <AppShell active={active} onChange={(r) => { setActive(r); setDetail(null); }}>
        <GlycemiaTargetEditView onBack={() => setDetail(null)} />
      </AppShell>
    );
  }

  if (detail === 'privacy') {
    return (
      <AppShell active={active} onChange={(r) => { setActive(r); setDetail(null); }}>
        <PrivacyView onBack={() => setDetail(null)} />
      </AppShell>
    );
  }

  const ctx = { user, onNavigate: (r: DetailRoute) => setDetail(r) };

  const content = (() => {
    switch (active) {
      case 'home':
        return <DashboardView ctx={ctx} />;
      case 'account':
        return <AccountView user={user} onLogout={handleLogout} onEditTarget={() => setDetail('edit-target')} onPrivacy={() => setDetail('privacy')} />;
      case 'glycemia':
        if (glycemiaView === 'reports') {
          return <ReportsView onBack={() => setGlycemiaView('main')} />;
        }
        return <GlycemiaView onShowReports={() => setGlycemiaView('reports')} />;
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
    <AppShell
      active={active}
      onChange={(r) => { setActive(r); setGlycemiaView('main'); }}
    >
      {content}
    </AppShell>
  );
}

export default App;