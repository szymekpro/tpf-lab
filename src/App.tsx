import { useEffect, useState } from 'react';
import { AppShell, type AppRoute } from './layouts/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { LoginView } from './features/login/LoginView';
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
import { InsulinView } from './features/insulin/InsulinView';
import type { BolusMealData } from './features/meals/MealsTypes';
import type { User } from './mocks';
import { firebaseLogout, onAuthChanged } from './lib/auth';
import { trackEvent, trackScreen } from './lib/analytics';
import type { DetailRoute } from './features/dashboard/tiles/types';

type AuthScreen = 'login' | 'register' | 'forgot';

type ScreenAnalytics = {
  key: string;
  title: string;
};

const AUTH_SCREEN_ANALYTICS: Record<AuthScreen, ScreenAnalytics> = {
  login:    { key: 'auth_login', title: 'Logowanie' },
  register: { key: 'auth_register', title: 'Rejestracja' },
  forgot:   { key: 'auth_forgot', title: 'Reset hasła' },
};

const APP_ROUTE_ANALYTICS: Record<AppRoute, ScreenAnalytics> = {
  home:     { key: 'home', title: 'Główny' },
  glycemia: { key: 'glycemia', title: 'Glikemia' },
  meals:    { key: 'meals', title: 'Posiłki' },
  insulin:  { key: 'insulin', title: 'Insulina' },
  account:  { key: 'account', title: 'Konto' },
};

const DETAIL_ROUTE_ANALYTICS: Record<DetailRoute, ScreenAnalytics> = {
  sensor:         { key: 'sensor_status', title: 'Status sensora' },
  'edit-target':  { key: 'edit_glycemia_target', title: 'Cel glikemii' },
  privacy:        { key: 'privacy_security', title: 'Prywatność i bezpieczeństwo' },
  alarms:         { key: 'alarms', title: 'Powiadomienia i alarmy' },
  'app-settings': { key: 'app_settings', title: 'Ustawienia aplikacji' },
};

function getScreenAnalytics(
  user: User | null,
  authScreen: AuthScreen,
  active: AppRoute,
  detail: DetailRoute | null,
  glycemiaView: 'main' | 'reports',
): ScreenAnalytics {
  if (!user) return AUTH_SCREEN_ANALYTICS[authScreen];
  if (detail) return DETAIL_ROUTE_ANALYTICS[detail];
  if (active === 'glycemia' && glycemiaView === 'reports') {
    return { key: 'glycemia_reports', title: 'Raporty glikemii' };
  }
  return APP_ROUTE_ANALYTICS[active];
}

function App() {
  const [active, setActive] =
    useState<AppRoute>('home');

  const [detail, setDetail] =
    useState<DetailRoute | null>(null);

  const [glycemiaView, setGlycemiaView] =
    useState<'main' | 'reports'>('main');

  const [authScreen, setAuthScreen] =
    useState<'login' | 'register' | 'forgot'>('login');

  const [user, setUser] =
    useState<User | null>(null);

  const [booting, setBooting] =
    useState(true);

  const [bolusMeal, setBolusMeal] =
    useState<BolusMealData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChanged(
      (currentUser) => {
        setUser(currentUser);
        setBooting(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (booting) return;
    void trackScreen(getScreenAnalytics(user, authScreen, active, detail, glycemiaView));
  }, [active, authScreen, booting, detail, glycemiaView, user]);

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
          onRegistered={(registeredUser) => {
            setUser(registeredUser);
            setActive('home');
            setAuthScreen('login');
          }}
          onGoToLogin={() =>
            setAuthScreen('login')
          }
        />
      );
    }

    if (authScreen === 'forgot') {
      return (
        <ForgotPasswordView
          onGoToLogin={() =>
            setAuthScreen('login')
          }
        />
      );
    }

    return (
      <LoginView
        onLoggedIn={(loggedUser) => {
          setUser(loggedUser);
          setActive('home');
        }}
        onGoToRegister={() =>
          setAuthScreen('register')
        }
        onForgotPassword={() =>
          setAuthScreen('forgot')
        }
      />
    );
  }

  async function handleLogout() {
    await firebaseLogout();
    void trackEvent('logout', { method: 'password' });

    setUser(null);
    setActive('home');
    setDetail(null);
    setBolusMeal(null);
  }

  function handleNavigation(route: AppRoute) {
    setActive(route);
    setDetail(null);
    setGlycemiaView('main');
  }

  function handleCalculateBolus(
    mealData: BolusMealData,
  ) {
    setBolusMeal(mealData);
    setDetail(null);
    setActive('insulin');
  }

  if (detail === 'sensor') {
    return (
      <AppShell
        active={active}
        onChange={handleNavigation}
      >
        <SensorStatusView
          onBack={() => setDetail(null)}
        />
      </AppShell>
    );
  }

  if (detail === 'edit-target') {
    return (
      <AppShell
        active={active}
        onChange={handleNavigation}
      >
        <GlycemiaTargetEditView
          onBack={() => setDetail(null)}
        />
      </AppShell>
    );
  }

  if (detail === 'privacy') {
    return (
      <AppShell
        active={active}
        onChange={handleNavigation}
      >
        <PrivacyView
          onBack={() => setDetail(null)}
        />
      </AppShell>
    );
  }

  if (detail === 'alarms') {
    return (
      <AppShell
        active={active}
        onChange={handleNavigation}
      >
        <AlarmsView
          onBack={() => setDetail(null)}
        />
      </AppShell>
    );
  }

  const ctx = {
    user,
    onNavigate: (route: DetailRoute) =>
      setDetail(route),
  };

  const content = (() => {
    switch (active) {
      case 'home':
        return <DashboardView ctx={ctx} />;

      case 'account':
        return (
          <AccountView
            user={user}
            onLogout={handleLogout}
            onEditTarget={() =>
              setDetail('edit-target')
            }
            onPrivacy={() =>
              setDetail('privacy')
            }
            onAlarms={() =>
              setDetail('alarms')
            }
          />
        );

      case 'glycemia':
        if (glycemiaView === 'reports') {
          return (
            <ReportsView
              onBack={() =>
                setGlycemiaView('main')
              }
            />
          );
        }

        return (
          <GlycemiaView
            onShowReports={() =>
              setGlycemiaView('reports')
            }
          />
        );

      case 'meals':
        return (
          <MealsPage
            onCalculateBolus={
              handleCalculateBolus
            }
          />
        );

      case 'insulin':
        return (
          <InsulinView
            key={
              bolusMeal
                ? `${bolusMeal.mealId}-${bolusMeal.ww}-${bolusMeal.wbt}-${bolusMeal.products.length}`
                : 'empty'
            }
            mealData={bolusMeal}
            onGoToMeals={() => setActive('meals')}
          />
        );

      default:
        return <DashboardView ctx={ctx} />;
    }
  })();

  return (
    <AppShell
      active={active}
      onChange={handleNavigation}
    >
      {content}
    </AppShell>
  );
}

export default App;