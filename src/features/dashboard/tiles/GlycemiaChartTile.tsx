import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Card } from '../../../components';
import { useUnit, convertGlycemia } from '../../../contexts/UnitContext';
import { useGlycemiaTarget } from '../../../contexts/GlycemiaTargetContext';
import { api, type GlycemiaPoint } from '../../../mocks';
import type { TileDefinition } from './types';
import './GlycemiaChartTile.css';

const W = 600;
const H = 300;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 32;
const Y_MIN = 40;
const Y_MAX = 280;

const RANGES = [3, 12, 24] as const;
type RangeHours = (typeof RANGES)[number];

function dotColor(v: number, min: number, max: number): string {
  if (v < min) return 'var(--color-danger-500)';
  if (v > max) return 'var(--color-warning-500)';
  return 'var(--color-tertiary-500)';
}

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function project(points: GlycemiaPoint[]) {
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const lastMin = points.at(-1)?.minute ?? 1;
  const span = lastMin || 1;
  return points.map(p => {
    const x = PAD_L + (p.minute / span) * innerW;
    const y = PAD_T + (1 - (p.value - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
    return { x, y };
  });
}

function GlycemiaChart() {
  const [hours, setHours] = useState<RangeHours>(24);
  const [points, setPoints] = useState<GlycemiaPoint[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const { unit } = useUnit();
  const { target } = useGlycemiaTarget();

  useEffect(() => {
    let alive = true;
    setPoints(null);
    setHover(null);
    api.getGlycemiaWindow(hours).then(p => alive && setPoints(p));
    return () => { alive = false; };
  }, [hours]);

  const proj = useMemo(() => (points && points.length ? project(points) : []), [points]);

  const lastMin = points?.at(-1)?.minute ?? 0;
  const nowMs = useMemo(() => Date.now(), [points]);

  function handleMove(e: MouseEvent<SVGSVGElement>) {
    if (!proj.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < proj.length; i++) {
      const d = Math.abs(proj[i].x - vbX);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHover(best);
  }

  const hoverPoint = hover != null && points ? proj[hover] : null;
  const hoverData = hover != null && points ? points[hover] : null;

  const innerH = H - PAD_T - PAD_B;
  const yTop = PAD_T + (1 - (target.max - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
  const yBot = PAD_T + (1 - (target.min - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;

  const yTicksMgdl = [target.min, target.max, 250].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  const chartBottomY = H - PAD_B;

  const xTicks = useMemo(() => {
    if (!lastMin) return [];
    const steps = hours <= 3 ? 3 : 4;
    const innerW = W - PAD_L - PAD_R;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const m = (lastMin * i) / steps;
      const x = PAD_L + (m / lastMin) * innerW;
      const label = i === steps ? 'Teraz' : formatClock(new Date(nowMs - (lastMin - m) * 60_000));
      return { x, label };
    });
  }, [lastMin, hours, nowMs]);

  return (
    <Card title="Glikemia">
      <div className="chart__ranges" role="group" aria-label="Zakres czasu wykresu">
        {RANGES.map(h => (
          <button
            key={h}
            type="button"
            className={`chart__range${h === hours ? ' chart__range--active' : ''}`}
            aria-pressed={h === hours}
            onClick={() => setHours(h)}
          >
            {h}h
          </button>
        ))}
      </div>
      <div className="chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="chart__svg"
          role="img"
          aria-label={`Wykres glikemii z ostatnich ${hours} godzin`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <rect
            x={PAD_L}
            y={yTop}
            width={W - PAD_L - PAD_R}
            height={yBot - yTop}
            fill="var(--color-tertiary-100)"
            opacity={0.5}
          />

          {yTicksMgdl.map(v => {
            const y = PAD_T + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
            const label = convertGlycemia(v, unit);
            return (
              <g key={`y-${v}`}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray="2 4" />
                <text x={PAD_L - 8} y={y + 4} textAnchor="end" className="chart__yLabel">{label}</text>
              </g>
            );
          })}
          <text x={PAD_L - 8} y={chartBottomY + 4} textAnchor="end" className="chart__yLabel">0</text>
          {xTicks.map((t, i) => (
            <text key={`x-${i}`} x={t.x} y={H - 10} textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'} className="chart__xLabel">
              {t.label}
            </text>
          ))}

          {proj.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2.4}
              fill={dotColor(points![i].value, target.min, target.max)}
            />
          ))}

          {hoverPoint && (
            <>
              <line
                x1={hoverPoint.x}
                x2={hoverPoint.x}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="var(--color-primary-500)"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <circle cx={hoverPoint.x} cy={hoverPoint.y} r={4.5} fill="var(--color-primary-500)" stroke="#fff" strokeWidth={1.5} />
            </>
          )}
        </svg>

        {hoverPoint && hoverData && (
          <div
            className="chart__tooltip"
            style={{
              left: `${(hoverPoint.x / W) * 100}%`,
              top: `${(hoverPoint.y / H) * 100}%`,
            }}
          >
            <span className="chart__tooltipTime">{formatClock(new Date(nowMs - (lastMin - hoverData.minute) * 60_000))}</span>
            <span className="chart__tooltipValue">{convertGlycemia(hoverData.value, unit)} {unit}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export const glycemiaChartTile: TileDefinition = {
  id: 'glycemia-chart',
  span: 12,
  priority: 15,
  Component: GlycemiaChart,
};
