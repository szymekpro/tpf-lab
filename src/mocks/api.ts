import type {
  AccountProfile,
  AgpBucket,
  DashboardStats,
  GlycemiaPeriodDays,
  GlycemiaPoint,
  GlycemiaSnapshot,
  GlycemiaStats,
  RecentReading,
  ReportData,
  SensorStatus,
  User,
} from './types';
import {
  computeAgpProfile,
  computeDailyBreakdown,
  computeStats,
  filterByDays,
  getRecentReadings,
  loadCgmData,
  to24hPoints,
  toDailyPoints,
} from './cgmData';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

const MOCK_USER: User = {
  id: 'u_1',
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna.kowalska@example.com',
};

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

const CURRENT_KEY = 'diabetcare_glycemia_current';

function loadCurrentOverride(): number | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (raw == null) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function saveCurrentValue(value: number) {
  try {
    localStorage.setItem(CURRENT_KEY, String(Math.round(value)));
  } catch {
  }
}

async function getLatestReadingValue(): Promise<number> {
  const override = loadCurrentOverride();
  if (override != null) return override;
  const all = await loadCgmData();
  return Math.round(all.at(-1)?.value ?? 124);
}

function buildSnapshot(value: number): GlycemiaSnapshot {
  return {
    value,
    trend: 'flat',
    inRange: value >= 70 && value <= 180,
    sensorOnline: true,
    measuredAt: new Date().toISOString(),
  };
}

export async function getCurrentGlycemia(): Promise<GlycemiaSnapshot> {
  await delay(150);
  return buildSnapshot(await getLatestReadingValue());
}

export async function calibrate(calibrated: number): Promise<GlycemiaSnapshot> {
  await delay(200);
  const current = await getLatestReadingValue();
  const adjusted = Math.round(current + (calibrated - current) * 0.8);
  saveCurrentValue(adjusted);
  return buildSnapshot(adjusted);
}

const TARGET_KEY = 'diabetcare_target';

function loadTargetRange(): { min: number; max: number } {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { min?: unknown; max?: unknown };
      const min = Number(parsed.min);
      const max = Number(parsed.max);
      if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > min) {
        return { min, max };
      }
    }
  } catch {
  }
  return { min: 70, max: 180 };
}

export async function getGlycemiaStats(days: GlycemiaPeriodDays): Promise<GlycemiaStats> {
  await delay(150);
  const all = await loadCgmData();
  const { min, max } = loadTargetRange();
  return computeStats(filterByDays(all, days), min, max);
}

export async function getGlycemiaChart(
  days: GlycemiaPeriodDays,
): Promise<{ points: GlycemiaPoint[]; mode: 'hourly' | 'daily' }> {
  await delay(200);
  const all = await loadCgmData();
  const slice = filterByDays(all, days);
  if (days === 1) {
    const points = to24hPoints(slice);
    if (points.length) {
      points[points.length - 1] = {
        minute: points[points.length - 1].minute,
        value: await getLatestReadingValue(),
      };
    }
    return { points, mode: 'hourly' };
  }
  return { points: toDailyPoints(slice), mode: 'daily' };
}

export async function getRecentGlycemiaReadings(count = 3, strideMin = 30): Promise<RecentReading[]> {
  await delay(120);
  const all = await loadCgmData();
  const { min, max } = loadTargetRange();
  return getRecentReadings(all, count, strideMin, min, max);
}

export async function getAgpProfile(days: GlycemiaPeriodDays): Promise<AgpBucket[]> {
  await delay(180);
  const all = await loadCgmData();
  return computeAgpProfile(filterByDays(all, days));
}

export async function getReportData(days: GlycemiaPeriodDays): Promise<ReportData> {
  await delay(200);
  const all = await loadCgmData();
  const { min, max } = loadTargetRange();
  const slice = filterByDays(all, days);
  return {
    periodDays: days,
    generatedAt: new Date().toISOString(),
    patientName: `${MOCK_USER.firstName} ${MOCK_USER.lastName ?? ''}`.trim(),
    targetMin: min,
    targetMax: max,
    stats: computeStats(slice, min, max),
    agp: computeAgpProfile(slice),
    daily: computeDailyBreakdown(slice, min, max),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(150);
  const stats = await getGlycemiaStats(1);
  return { tir: stats.tir, gmi: stats.gmi, iob: 2.4 };
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

export async function getGlycemia24h(): Promise<GlycemiaPoint[]> {
  const { points } = await getGlycemiaChart(1);
  return points;
}
