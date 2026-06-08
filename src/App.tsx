import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, type AppRoute } from './layouts/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { LoginView } from './features/login/LoginView';
import { AccountView } from './features/account/AccountView';
import { SensorStatusView } from './features/sensor/SensorStatusView';
import { GlycemiaTargetEditView } from './features/account/GlycemiaTargetEditView';
import { PrivacyView } from './features/account/PrivacyView';
import { AppSettingsView } from './features/account/AppSettingsView';
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

type ScreenAnalytics = {
  key: string;
  title: string;
};

const APP_ROUTE_ANALYTICS: Record<AppRoute, ScreenAnalytics> = {
  home:     { key: 'home', title: 'Główny' },
  glycemia: { key: 'glycemia', title: 'Glikemia' },
  meals:    { key: 'meals', title: 'Posiłki' },
  insulin:  { key: 'insulin', title: 'Insulina' },
  account:  { key: 'account', title: 'Konto' },
};

const DETAIL_ROUTE_PATHS: Record<DetailRoute, string> = {
  sensor:         '/sensor',
  'edit-target':  '/account/target',
  privacy:        '/account/privacy',
  alarms:         '/account/alarms',
  'app-settings': '/account/settings',
};

const DETAIL_PATH_ANALYTICS: Record<string, ScreenAnalytics> = {
  '/sensor':           { key: 'sensor_status', title: 'Status sensora' },
  '/account/target':   { key: 'edit_glycemia_target', title: 'Cel glikemii' },
  '/account/privacy':  { key: 'privacy_security', title: 'Prywatność i bezpieczeństwo' },
  '/account/alarms':   { key: 'alarms', title: 'Powiadomienia i alarmy' },
  '/account/settings': { key: 'app_settings', title: 'Ustawienia aplikacji' },
};

function isAuthPath(pathname: string): boolean {
  return pathname === '/login'
    || pathname === '/register'
    || pathname === '/forgot-password';
}

function getAuthScreenAnalytics(pathname: string): ScreenAnalytics {
  switch (pathname) {
    case '/register':
      return { key: 'auth_register', title: 'Rejestracja' };
    case '/forgot-password':
      return { key: 'auth_forgot', title: 'Reset hasła' };
    default:
      return { key: 'auth_login', title: 'Logowanie' };
  }
}

function getActiveRoute(pathname: string): AppRoute {
  if (pathname.startsWith('/glycemia')) return 'glycemia';
  if (pathname.startsWith('/meals')) return 'meals';
  if (pathname.startsWith('/insulin')) return 'insulin';
  if (pathname.startsWith('/account')) return 'account';
  return 'home';
}

function getScreenAnalytics(pathname: string, user: User | null): ScreenAnalytics {
  if (!user) return getAuthScreenAnalytics(pathname);
  if (pathname === '/glycemia/reports') {
    return { key: 'glycemia_reports', title: 'Raporty glikemii' };
  }
  return DETAIL_PATH_ANALYTICS[pathname] ?? APP_ROUTE_ANALYTICS[getActiveRoute(pathname)];
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

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
    if (!user && !isAuthPath(location.pathname)) return;
    if (user && isAuthPath(location.pathname)) return;

    void trackScreen(getScreenAnalytics(location.pathname, user));
  }, [booting, location.pathname, user]);

  if (booting) {
    return (
      <div className="app__boot">
        <span>Ładowanie…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={(
            <LoginView
              onLoggedIn={(loggedUser) => {
                setUser(loggedUser);
                navigate('/', { replace: true });
              }}
              onGoToRegister={() =>
                navigate('/register')
              }
              onForgotPassword={() =>
                navigate('/forgot-password')
              }
            />
          )}
        />
        <Route
          path="/register"
          element={(
            <RegisterView
              onRegistered={(registeredUser) => {
                setUser(registeredUser);
                navigate('/', { replace: true });
              }}
              onGoToLogin={() =>
                navigate('/login')
              }
            />
          )}
        />
        <Route
          path="/forgot-password"
          element={(
            <ForgotPasswordView
              onGoToLogin={() =>
                navigate('/login')
              }
            />
          )}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (isAuthPath(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  async function handleLogout() {
    await firebaseLogout();
    void trackEvent('logout', { method: 'password' });

    setUser(null);
    setBolusMeal(null);
    navigate('/login', { replace: true });
  }

  function handleCalculateBolus(
    mealData: BolusMealData,
  ) {
    setBolusMeal(mealData);
    navigate('/insulin');
  }

  const ctx = {
    user,
    onNavigate: (route: DetailRoute) =>
      navigate(DETAIL_ROUTE_PATHS[route]),
  };

  const active = getActiveRoute(location.pathname);

  return (
    <AppShell active={active}>
      <Routes>
        <Route path="/" element={<DashboardView ctx={ctx} />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route
          path="/sensor"
          element={(
            <SensorStatusView
              onBack={() => navigate('/')}
            />
          )}
        />
        <Route
          path="/glycemia"
          element={(
            <GlycemiaView
              onShowReports={() =>
                navigate('/glycemia/reports')
              }
            />
          )}
        />
        <Route
          path="/glycemia/reports"
          element={(
            <ReportsView
              onBack={() =>
                navigate('/glycemia')
              }
            />
          )}
        />
        <Route
          path="/meals"
          element={(
            <MealsPage
              onCalculateBolus={
                handleCalculateBolus
              }
            />
          )}
        />
        <Route
          path="/insulin"
          element={(
            <InsulinView
              key={
                bolusMeal
                  ? `${bolusMeal.mealId}-${bolusMeal.ww}-${bolusMeal.wbt}-${bolusMeal.products.length}`
                  : 'empty'
              }
              mealData={bolusMeal}
              onGoToMeals={() =>
                navigate('/meals')
              }
            />
          )}
        />
        <Route
          path="/account"
          element={(
            <AccountView
              user={user}
              onLogout={handleLogout}
              onEditTarget={() =>
                navigate('/account/target')
              }
              onPrivacy={() =>
                navigate('/account/privacy')
              }
              onAlarms={() =>
                navigate('/account/alarms')
              }
              onSettings={() =>
                navigate('/account/settings')
              }
            />
          )}
        />
        <Route
          path="/account/target"
          element={(
            <GlycemiaTargetEditView
              onBack={() => navigate('/account')}
            />
          )}
        />
        <Route
          path="/account/privacy"
          element={(
            <PrivacyView
              onBack={() => navigate('/account')}
              onAccountDeleted={() => {
                setUser(null);
                navigate('/login', { replace: true });
              }}
            />
          )}
        />
        <Route
          path="/account/alarms"
          element={(
            <AlarmsView
              onBack={() => navigate('/account')}
            />
          )}
        />
        <Route
          path="/account/settings"
          element={(
            <AppSettingsView
              onBack={() => navigate('/account')}
            />
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
