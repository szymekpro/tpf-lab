/** Typy współdzielone przez warstwę mocków i konsumentów. */

export type User = {
  id: string;
  firstName: string;
  email: string;
};

export type GlycemiaTrend = 'up' | 'down' | 'flat';

export type GlycemiaSnapshot = {
  /** mg/dL */
  value: number;
  trend: GlycemiaTrend;
  /** Czy obecna wartość jest w przedziale docelowym 70–180 mg/dL. */
  inRange: boolean;
  sensorOnline: boolean;
  measuredAt: string; // ISO
};

export type GlycemiaPoint = {
  /** Minuta od początku osi (0–24h*60). */
  minute: number;
  value: number; // mg/dL
};

export type DashboardStats = {
  /** Time-In-Range w % (0–100). */
  tir: number;
  /** Glucose Management Indicator w %. */
  gmi: number;
  /** Insulin On Board w jednostkach. */
  iob: number;
};
