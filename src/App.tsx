import { useEffect, useState } from 'react';
import { AppShell, type AppRoute } from './layouts/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { LoginView } from './features/login/LoginView';
//import { PlaceholderView } from './features/placeholder/PlaceholderView';
import { AccountView } from './features/account/AccountView';
import { SensorStatusView } from './features/sensor/SensorStatusView';
import { GlycemiaTargetEditView } from './features/account/GlycemiaTargetEditView';
import { PrivacyView } from './features/account/PrivacyView';
import MealsPage from './features/meals/MealsPage';
import { GlycemiaView } from './features/glycemia/GlycemiaView';
import { ReportsView } from './features/reports/ReportsView';
import { AlarmsView } from './features/alarms/AlarmsView';
import { RegisterView } from './features/login/RegisterView';
import { ForgotPasswordView } from './features/login/ForgotPasswordView';
import type { User } from './mocks';
import { firebaseLogout, onAuthChanged } from './lib/auth';
import type { DetailRoute } from './features/dashboard/tiles/types';
import { InsulinView } from './features/insulin/InsulinView';

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
    setUser(null);
    setActive('home');
    setDetail(null);
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

  if (detail === 'alarms') {
    return (
      <AppShell active={active} onChange={(r) => { setActive(r); setDetail(null); }}>
        <AlarmsView onBack={() => setDetail(null)} />
      </AppShell>
    );
  }

  const ctx = { user, onNavigate: (r: DetailRoute) => setDetail(r) };

  const content = (() => {
    switch (active) {
      case 'home':
        return <DashboardView ctx={ctx} />;
      case 'account':
        return <AccountView user={user} onLogout={handleLogout} onEditTarget={() => setDetail('edit-target')} onPrivacy={() => setDetail('privacy')} onAlarms={() => setDetail('alarms')} />;
      case 'glycemia':
        if (glycemiaView === 'reports') {
          return <ReportsView onBack={() => setGlycemiaView('main')} />;
        }
        return <GlycemiaView onShowReports={() => setGlycemiaView('reports')} />;
      case 'meals':
        return <MealsPage />;
      case 'insulin':
  return <InsulinView />;
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