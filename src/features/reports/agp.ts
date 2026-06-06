import type { AgpBucket } from '../../mocks';

export const AGP_W = 300;
export const AGP_H = 120;
export const AGP_VMIN = 40;
export const AGP_VMAX = 320;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function agpX(minute: number): number {
  return (minute / 1440) * AGP_W;
}

export function agpY(value: number): number {
  return AGP_H * (1 - (clamp(value, AGP_VMIN, AGP_VMAX) - AGP_VMIN) / (AGP_VMAX - AGP_VMIN));
}

type PercentileKey = 'p10' | 'p25' | 'p50' | 'p75' | 'p90';

export function agpBandPath(agp: AgpBucket[], hi: PercentileKey, lo: PercentileKey): string {
  if (!agp.length) return '';
  const top = agp.map(b => `${agpX(b.minute).toFixed(1)},${agpY(b[hi]).toFixed(1)}`);
  const bottom = agp
    .slice()
    .reverse()
    .map(b => `${agpX(b.minute).toFixed(1)},${agpY(b[lo]).toFixed(1)}`);
  return `M${top.join(' L')} L${bottom.join(' L')} Z`;
}

export function agpLinePath(agp: AgpBucket[], key: PercentileKey): string {
  if (!agp.length) return '';
  return agp
    .map((b, i) => `${i === 0 ? 'M' : 'L'}${agpX(b.minute).toFixed(1)} ${agpY(b[key]).toFixed(1)}`)
    .join(' ');
}
