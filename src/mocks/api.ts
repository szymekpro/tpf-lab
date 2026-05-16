/**
 * Zamockowane API – emuluje backend opóźnieniem `delay` ms.
 * Aby podpiąć prawdziwy backend wystarczy wymienić ciało funkcji
 * (sygnatury są zamierzone takie, jak realne endpointy).
 */
import type {
  AccountProfile,
  DashboardStats,
  GlycemiaPoint,
  GlycemiaSnapshot,
  SensorStatus,
  User,
} from './types';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

/* ===================== AUTH ===================== */

const MOCK_USER: User = {
  id: 'u_1',
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna.kowalska@example.com',
};

/** Mock credentials: admin / admin  lub  anna.kowalska@example.com / dowolne hasło ≥4 znaki */
const MOCK_CREDENTIALS: Record<string, string> = {
  'admin': 'admin',
  'anna.kowalska@example.com': 'admin',
};

const SESSION_KEY = 'diabetcare_session';

function saveSession(user: User) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function loadSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const MOCK_ACCOUNT: AccountProfile = {
  user: MOCK_USER,
  clinical: {
    icr: '1:10',
    isf: 40,
    targetMin: 70,
    targetMax: 180,
  },
  preferences: {
    unit: 'mg/dL',
  },
};

export async function login(email: string, password: string): Promise<User> {
  await delay(450);
  const expected = MOCK_CREDENTIALS[email];
  if (!expected || expected !== password) {
    throw new Error('Nieprawidłowy login lub hasło.');
  }
  saveSession(MOCK_USER);
  return MOCK_USER;
}

export async function getCurrentUser(): Promise<User> {
  await delay(200);
  const user = loadSession();
  if (!user) throw new Error('Brak aktywnej sesji.');
  return user;
}

export async function logout(): Promise<void> {
  await delay(100);
  clearSession();
}

export async function getAccountProfile(): Promise<AccountProfile> {
  await delay(280);
  return MOCK_ACCOUNT;
}

/* =================== DASHBOARD =================== */

/**
 * Wewnętrzny stan glikemii – jedyne źródło prawdy dla mock sensora.
 * Kalibracja modyfikuje tę wartość z korektą 80%.
 */
let _glycemia = 124;

function buildSnapshot(): GlycemiaSnapshot {
  return {
    value: Math.round(_glycemia),
    trend: 'flat',
    inRange: _glycemia >= 70 && _glycemia <= 180,
    sensorOnline: true,
    measuredAt: new Date().toISOString(),
  };
}

export async function getCurrentGlycemia(): Promise<GlycemiaSnapshot> {
  await delay(150);
  return buildSnapshot();
}

/**
 * Kalibracja: nowa wartość = obecna + 80% różnicy (nie przeskakuje bezpośrednio).
 * Formuła: current + (calibrated − current) × 0.8
 */
export async function calibrate(calibrated: number): Promise<GlycemiaSnapshot> {
  await delay(200);
  _glycemia = _glycemia + (calibrated - _glycemia) * 0.8;
  return buildSnapshot();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(150);
  return { tir: 78, gmi: 6.8, iob: 2.4 };
}

export async function getSensorStatus(): Promise<SensorStatus> {
  await delay(180);
  return {
    online: true,
    model: 'Dexcom G6',
    calibrationHistory: [
      { label: 'Dzisiaj, 08:30',   source: 'Glukometr', value: 112 },
      { label: 'Wczoraj, 19:15',   source: 'Glukometr', value: 98  },
      { label: '12 Paź, 07:45',    source: 'Glukometr', value: 105 },
    ],
  };
}

/** Punkty w ciągu ostatnich 24h, krok 30 minut – w sumie 49 próbek. */
export async function getGlycemia24h(): Promise<GlycemiaPoint[]> {
  await delay(200);
  // Realistyczna sinusoida wokół 130 z lekkim peakiem porannym i wieczornym.
  const points: GlycemiaPoint[] = [];
  for (let i = 0; i <= 48; i++) {
    const minute = i * 30;
    const hour = minute / 60;
    const base = 130;
    const breakfastSpike = 35 * Math.exp(-((hour - 8.5) ** 2) / 1.2);
    const lunchSpike     = 30 * Math.exp(-((hour - 13)  ** 2) / 1.5);
    const dinnerSpike    = 28 * Math.exp(-((hour - 19)  ** 2) / 2.0);
    const wave  = Math.sin(hour / 2) * 8;
    const noise = (Math.sin(i * 7.3) + Math.cos(i * 3.1)) * 4;
    const value = Math.round(base + breakfastSpike + lunchSpike + dinnerSpike + wave + noise);
    points.push({ minute, value });
  }
  return points;
}
