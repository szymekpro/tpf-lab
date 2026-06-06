import type { AgpBucket, AlarmEvent, CgmReading, DailyStat, GlycemiaPoint, GlycemiaStats } from './types';

const TARGET_MIN = 70;
const TARGET_MAX = 180;

let cache: CgmReading[] | null = null;
let loadPromise: Promise<CgmReading[]> | null = null;

function parseCsv(text: string): CgmReading[] {
  return text
    .trim()
    .split('\n')
    .slice(1)
    .map(line => {
      const [timestamp, value] = line.split(',');
      return { timestamp: new Date(timestamp), value: Number(value) };
    })
    .filter(r => !Number.isNaN(r.value) && !Number.isNaN(r.timestamp.getTime()));
}

export async function loadCgmData(): Promise<CgmReading[]> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = fetch('/cgm-data.csv')
      .then(res => {
        if (!res.ok) throw new Error('Nie udało się wczytać cgm-data.csv');
        return res.text();
      })
      .then(text => {
        cache = parseCsv(text).sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );
        return cache;
      });
  }
  return loadPromise;
}

export function filterByDays(readings: CgmReading[], days: number): CgmReading[] {
  if (!readings.length) return [];
  const endMs = readings.at(-1)!.timestamp.getTime();
  const startMs = endMs - days * 24 * 60 * 60 * 1000;
  return readings.filter(r => r.timestamp.getTime() >= startMs);
}

export function filterByHours(readings: CgmReading[], hours: number): CgmReading[] {
  if (!readings.length) return [];
  const endMs = readings.at(-1)!.timestamp.getTime();
  const startMs = endMs - hours * 60 * 60 * 1000;
  return readings.filter(r => r.timestamp.getTime() >= startMs);
}

export function computeStats(
  readings: CgmReading[],
  targetMin = TARGET_MIN,
  targetMax = TARGET_MAX,
): GlycemiaStats {
  if (!readings.length) {
    return { tir: 0, above: 0, below: 0, avgGlycemia: 0, gmi: 0, sampleCount: 0 };
  }

  const n = readings.length;
  const sum = readings.reduce((s, r) => s + r.value, 0);
  const avg = sum / n;
  const inRange = readings.filter(r => r.value >= targetMin && r.value <= targetMax).length;
  const above = readings.filter(r => r.value > targetMax).length;
  const below = readings.filter(r => r.value < targetMin).length;

  return {
    tir: Math.round((inRange / n) * 100),
    above: Math.round((above / n) * 100),
    below: Math.round((below / n) * 100),
    avgGlycemia: Math.round(avg),
    gmi: Math.round((3.31 + 0.02392 * avg) * 10) / 10,
    sampleCount: n,
  };
}

export function to24hPoints(readings: CgmReading[]): GlycemiaPoint[] {
  if (!readings.length) return [];
  const startMs = readings[0].timestamp.getTime();
  return readings.map(r => ({
    minute: Math.round((r.timestamp.getTime() - startMs) / 60_000),
    value: r.value,
  }));
}

export function toDailyPoints(readings: CgmReading[]): GlycemiaPoint[] {
  const byDay = new Map<string, number[]>();
  for (const r of readings) {
    const key = r.timestamp.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(r.value);
    else byDay.set(key, [r.value]);
  }

  return Array.from(byDay.values()).map((values, dayIndex) => ({
    minute: dayIndex,
    value: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
  }));
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeAgpProfile(readings: CgmReading[], bucketMin = 30): AgpBucket[] {
  const buckets = new Map<number, number[]>();
  for (const r of readings) {
    const minuteOfDay = r.timestamp.getHours() * 60 + r.timestamp.getMinutes();
    const key = Math.floor(minuteOfDay / bucketMin) * bucketMin;
    const arr = buckets.get(key);
    if (arr) arr.push(r.value);
    else buckets.set(key, [r.value]);
  }

  const result: AgpBucket[] = [];
  for (let m = 0; m < 1440; m += bucketMin) {
    const arr = buckets.get(m);
    if (!arr || !arr.length) continue;
    arr.sort((a, b) => a - b);
    result.push({
      minute: m,
      p10: Math.round(percentile(arr, 0.1)),
      p25: Math.round(percentile(arr, 0.25)),
      p50: Math.round(percentile(arr, 0.5)),
      p75: Math.round(percentile(arr, 0.75)),
      p90: Math.round(percentile(arr, 0.9)),
    });
  }
  return result;
}

export function computeDailyBreakdown(
  readings: CgmReading[],
  targetMin = TARGET_MIN,
  targetMax = TARGET_MAX,
): DailyStat[] {
  const byDay = new Map<string, CgmReading[]>();
  for (const r of readings) {
    const key = r.timestamp.toISOString().slice(0, 10);
    const arr = byDay.get(key);
    if (arr) arr.push(r);
    else byDay.set(key, [r]);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, arr]) => {
      const values = arr.map(r => r.value);
      const n = values.length;
      const avg = Math.round(values.reduce((s, v) => s + v, 0) / n);
      const inRange = values.filter(v => v >= targetMin && v <= targetMax).length;
      const [y, mo, d] = key.split('-');
      return {
        date: `${d}.${mo}`,
        avg,
        tir: Math.round((inRange / n) * 100),
        min: Math.min(...values),
        max: Math.max(...values),
        _sortKey: `${y}-${mo}-${d}`,
      } as DailyStat & { _sortKey: string };
    })
    .map(({ _sortKey, ...rest }) => rest);
}

const CRITICAL_LOW = 55;

/**
 * Wykrywa epizody alarmowe w danych CGM względem progów `low`/`high`.
 * Kolejne odczyty poza zakresem traktowane są jako jeden epizod; zapisywany jest
 * skrajny punkt (minimum dla hipo, maksimum dla hiper) i jego czas.
 * Zwraca najnowsze epizody jako pierwsze.
 */
export function computeAlarmEvents(
  readings: CgmReading[],
  low: number,
  high: number,
  maxEvents = 8,
): AlarmEvent[] {
  const now = readings.at(-1)?.timestamp ?? new Date();
  const events: AlarmEvent[] = [];

  let active: 'low' | 'high' | null = null;
  let extremeVal = 0;
  let extremeAt = now;

  const flush = () => {
    if (!active) return;
    const tone = active;
    const title =
      tone === 'low'
        ? extremeVal < CRITICAL_LOW
          ? 'Krytycznie niski poziom'
          : 'Niski poziom glikemii'
        : 'Wysoki poziom glikemii';
    events.push({
      id: `${extremeAt.getTime()}`,
      title,
      time: formatReadingTime(extremeAt, now),
      value: Math.round(extremeVal),
      tone,
    });
    active = null;
  };

  for (const r of readings) {
    const zone: 'low' | 'high' | null = r.value < low ? 'low' : r.value > high ? 'high' : null;
    if (zone === null) {
      flush();
      continue;
    }
    if (active !== zone) {
      flush();
      active = zone;
      extremeVal = r.value;
      extremeAt = r.timestamp;
    } else if ((zone === 'low' && r.value < extremeVal) || (zone === 'high' && r.value > extremeVal)) {
      extremeVal = r.value;
      extremeAt = r.timestamp;
    }
  }
  flush();

  return events.reverse().slice(0, maxEvents);
}

function formatReadingTime(date: Date, now: Date): string {
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Dzisiaj, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Wczoraj, ${time}`;

  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + `, ${time}`;
}

export function getRecentReadings(
  readings: CgmReading[],
  count = 3,
  strideMin = 30,
  targetMin = TARGET_MIN,
  targetMax = TARGET_MAX,
) {
  const now = readings.at(-1)?.timestamp ?? new Date();
  const step = Math.max(1, Math.round(strideMin / 5));
  const picked: CgmReading[] = [];
  for (let i = readings.length - 1; i >= 0 && picked.length < count; i -= step) {
    picked.push(readings[i]);
  }
  return picked.map((r, i) => ({
    id: String(i),
    value: r.value,
    time: formatReadingTime(r.timestamp, now),
    status: (r.value > targetMax ? 'high' : r.value < targetMin ? 'low' : 'ok') as
      | 'ok'
      | 'high'
      | 'low',
  }));
}
