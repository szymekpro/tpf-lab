export type User = {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
};

export type GlycemiaTrend = 'up' | 'down' | 'flat';

export type GlycemiaSnapshot = {
  value: number;
  trend: GlycemiaTrend;
  inRange: boolean;
  sensorOnline: boolean;
  measuredAt: string;
};

export type GlycemiaPoint = {
  minute: number;
  value: number;
};

export type CgmReading = {
  timestamp: Date;
  value: number;
};

export type GlycemiaStats = {
  tir: number;
  above: number;
  below: number;
  avgGlycemia: number;
  gmi: number;
  sampleCount: number;
};

export type GlycemiaPeriodDays = 1 | 7 | 14 | 30 | 90;

export type AgpBucket = {
  minute: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

export type AlarmEvent = {
  id: string;
  title: string;
  time: string;
  value: number;
  tone: 'low' | 'high';
};

export type DailyStat = {
  date: string;
  avg: number;
  tir: number;
  min: number;
  max: number;
};

export type ReportData = {
  periodDays: number;
  generatedAt: string;
  patientName: string;
  targetMin: number;
  targetMax: number;
  stats: GlycemiaStats;
  agp: AgpBucket[];
  daily: DailyStat[];
};

export type RecentReading = {
  id: string;
  value: number;
  time: string;
  status: 'ok' | 'high' | 'low';
};

export type DashboardStats = {
  tir: number;
  gmi: number;
  iob: number;
};

export type GlycemiaUnit = 'mg/dL' | 'mmol/L';

export type AccountClinical = {
  icr: string;
  isf: number;
  targetMin: number;
  targetMax: number;
};

export type CalibrationEntry = {
  label: string;
  source: string;
  value: number;
};

export type SensorStatus = {
  online: boolean;
  model: string;
  calibrationHistory: CalibrationEntry[];
};

export type AccountPreferences = {
  unit: GlycemiaUnit;
};

export type AccountProfile = {
  user: User;
  clinical: AccountClinical;
  preferences: AccountPreferences;
};
