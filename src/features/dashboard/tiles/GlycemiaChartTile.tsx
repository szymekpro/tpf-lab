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

function zoneColor(a: number, b: number, min: number, max: number): string {
  if (a < min || b < min) return 'var(--color-danger-500)';
  if (a > max || b > max) return 'var(--color-warning-500)';
  return 'var(--color-tertiary-500)';
}

function formatMinute(minute: number): string {
  const total = Math.round(minute);
  const h = Math.floor(total / 60) % 24;
  const m = ((total % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function project(points: GlycemiaPoint[]) {
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const lastMin = points.at(-1)?.minute ?? 24 * 60;
  return points.map(p => {
    const x = PAD_L + (p.minute / lastMin) * innerW;
    const y = PAD_T + (1 - (p.value - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
    return { x, y };
  });
}

function GlycemiaChart() {
  const [points, setPoints] = useState<GlycemiaPoint[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const { unit } = useUnit();
  const { target } = useGlycemiaTarget();

  useEffect(() => {
    let alive = true;
    api.getGlycemia24h().then(p => alive && setPoints(p));
    return () => { alive = false; };
  }, []);

  const { proj, segments, areaPath } = useMemo(() => {
    if (!points || !points.length) return { proj: [], segments: [], areaPath: '' };
    const pr = project(points);
    const segs = pr.slice(0, -1).map((p, i) => ({
      key: i,
      d: `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${pr[i + 1].x.toFixed(1)} ${pr[i + 1].y.toFixed(1)}`,
      color: zoneColor(points[i].value, points[i + 1].value, target.min, target.max),
    }));
    const line = pr.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const bottomY = (H - PAD_B).toFixed(1);
    const area = `${line} L${pr.at(-1)!.x.toFixed(1)} ${bottomY} L${pr[0].x.toFixed(1)} ${bottomY} Z`;
    return { proj: pr, segments: segs, areaPath: area };
  }, [points, target.min, target.max]);

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
  const yTop    = PAD_T + (1 - (target.max - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
  const yBot    = PAD_T + (1 - (target.min - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;

  const yTicksMgdl = [target.min, target.max, 250].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  const xTicks = [0, 6, 12, 18];
  const chartBottomY = H - PAD_B;

  return (
    <Card title="Glikemia (24h)">
      <div className="chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="chart__svg"
          role="img"
          aria-label="Wykres glikemii w ciągu 24 godzin"
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

          {areaPath && (
            <path d={areaPath} fill="var(--color-tertiary-100)" opacity={0.55} />
          )}
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
          {xTicks.map(h => {
            const x = PAD_L + (h / 24) * (W - PAD_L - PAD_R);
            return (
              <text key={`x-${h}`} x={x} y={H - 10} textAnchor="middle" className="chart__xLabel">
                {h.toString().padStart(2, '0')}:00
              </text>
            );
          })}
          <text x={W - PAD_R} y={H - 10} textAnchor="end" className="chart__xLabel">Teraz</text>

          {segments.map(s => (
            <path
              key={s.key}
              d={s.d}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
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
              <circle cx={hoverPoint.x} cy={hoverPoint.y} r={4} fill="var(--color-primary-500)" stroke="#fff" strokeWidth={1.5} />
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
            <span className="chart__tooltipTime">{formatMinute(hoverData.minute)}</span>
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
  priority: 30,
  Component: GlycemiaChart,
};
