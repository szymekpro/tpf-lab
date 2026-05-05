/**
 * Zamockowane API – emuluje backend opóźnieniem `delay` ms.
 * Aby podpiąć prawdziwy backend wystarczy wymienić ciało funkcji
 * (sygnatury są zamierzone takie, jak realne endpointy).
 */
import type {
  DashboardStats,
  GlycemiaPoint,
  GlycemiaSnapshot,
  User,
} from './types';

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

/* ===================== AUTH ===================== */

const MOCK_USER: User = {
  id: 'u_1',
  firstName: 'Anna',
  email: 'anna@diabetcare.app',
};

export async function login(email: string, password: string): Promise<User> {
  await delay(450);
  if (!email.includes('@') || password.length < 4) {
    throw new Error('Nieprawidłowy e-mail lub hasło.');
  }
  return MOCK_USER;
}

/* =================== DASHBOARD =================== */

export async function getCurrentGlycemia(): Promise<GlycemiaSnapshot> {
  await delay(150);
  return {
    value: 124,
    trend: 'flat',
    inRange: true,
    sensorOnline: true,
    measuredAt: new Date().toISOString(),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(150);
  return { tir: 78, gmi: 6.8, iob: 2.4 };
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
