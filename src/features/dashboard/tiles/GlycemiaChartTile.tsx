import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components';
import { useUnit, convertGlycemia } from '../../../contexts/UnitContext';
import { useGlycemiaTarget } from '../../../contexts/GlycemiaTargetContext';
import { api, type GlycemiaPoint } from '../../../mocks';
import type { TileDefinition } from './types';
import './GlycemiaChartTile.css';

const W = 600;       // viewBox width
const H = 220;       // viewBox height
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 32;
const Y_MIN = 40;
const Y_MAX = 280;

/** Mapowanie wartości na koordynaty w viewBox. */
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
  const { unit } = useUnit();
  const { target } = useGlycemiaTarget();

  useEffect(() => {
    let alive = true;
    api.getGlycemia24h().then(p => alive && setPoints(p));
    return () => { alive = false; };
  }, []);

  const { linePath, areaPath } = useMemo(() => {
    if (!points) return { linePath: '', areaPath: '' };
    const proj = project(points);
    const line = proj.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const bottomY = (H - PAD_B).toFixed(1);
    const area = `${line} L${proj.at(-1)!.x.toFixed(1)} ${bottomY} L${proj[0].x.toFixed(1)} ${bottomY} Z`;
    return { linePath: line, areaPath: area };
  }, [points]);

  // Pasek strefy docelowej (z kontekstu)
  const innerH = H - PAD_T - PAD_B;
  const yTop    = PAD_T + (1 - (target.max - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;
  const yBot    = PAD_T + (1 - (target.min - Y_MIN) / (Y_MAX - Y_MIN)) * innerH;

  const yTicksMgdl = [target.min, target.max, 250].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  const xTicks = [0, 6, 12, 18];
  const chartBottomY = H - PAD_B;

  return (
    <Card title="Glikemia (24h)">
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart__svg" role="img" aria-label="Wykres glikemii w ciągu 24 godzin">
          {/* Strefa docelowa */}
          <rect
            x={PAD_L}
            y={yTop}
            width={W - PAD_L - PAD_R}
            height={yBot - yTop}
            fill="var(--color-tertiary-100)"
            opacity={0.5}
          />

          {/* Wypełnienie pod linią */}
          {areaPath && (
            <path d={areaPath} fill="var(--color-tertiary-100)" opacity={0.55} />
          )}
          {/* Y-grid + etykiety */}
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
          {/* Etykieta 0 przy linii bazowej */}
          <text x={PAD_L - 8} y={chartBottomY + 4} textAnchor="end" className="chart__yLabel">0</text>
          {/* X labels */}
          {xTicks.map(h => {
            const x = PAD_L + (h / 24) * (W - PAD_L - PAD_R);
            return (
              <text key={`x-${h}`} x={x} y={H - 10} textAnchor="middle" className="chart__xLabel">
                {h.toString().padStart(2, '0')}:00
              </text>
            );
          })}
          <text x={W - PAD_R} y={H - 10} textAnchor="end" className="chart__xLabel">Teraz</text>

          {/* Linia */}
          {linePath && (
            <path d={linePath} fill="none" stroke="var(--color-tertiary-500)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          )}
        </svg>
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
