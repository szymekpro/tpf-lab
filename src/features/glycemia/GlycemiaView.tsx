import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Card, Button, Icon } from '../../components';
import { api } from '../../mocks';
import type { GlycemiaPoint, GlycemiaStats, RecentReading } from '../../mocks';
import { useGlycemiaTarget } from '../../contexts/GlycemiaTargetContext';
import { useUnit, convertGlycemia } from '../../contexts/UnitContext';
import './GlycemiaView.css';

const RECENT_STEP = 7;

type Range = '24h' | '7d' | '14d' | '30d';

const RANGES: { id: Range; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d',  label: '7 dni' },
  { id: '14d', label: '14 dni' },
  { id: '30d', label: '30 dni' },
];

const RANGE_DAYS: Record<Range, 1 | 7 | 14 | 30> = {
  '24h': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

const CHART_LABELS: Record<Range, string> = {
  '24h': 'Wykres 24h',
  '7d': 'Średnia dzienna (7 dni)',
  '14d': 'Średnia dzienna (14 dni)',
  '30d': 'Średnia dzienna (30 dni)',
};

type Props = {
  onShowReports: () => void;
};

const CHART_W = 300;
const CHART_H = 280;
const MAX_VAL = 300;

function toY(v: number) {
  return CHART_H - (v / MAX_VAL) * CHART_H;
}

function zoneColor(a: number, b: number, min: number, max: number): string {
  if (a < min || b < min) return 'var(--color-danger-500)';
  if (a > max || b > max) return 'var(--color-warning-500)';
  return 'var(--color-primary-500)';
}

function formatMinute(minute: number): string {
  const total = Math.round(minute);
  const h = Math.floor(total / 60) % 24;
  const m = ((total % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function GlycemiaView({ onShowReports }: Props) {
  const { target } = useGlycemiaTarget();
  const { unit } = useUnit();
  const [range, setRange] = useState<Range>('24h');
  const [points, setPoints] = useState<GlycemiaPoint[]>([]);
  const [stats, setStats] = useState<GlycemiaStats | null>(null);
  const [recentReadings, setRecentReadings] = useState<RecentReading[]>([]);
  const [recentCount, setRecentCount] = useState(3);
  const [chartMode, setChartMode] = useState<'hourly' | 'daily'>('hourly');
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const days = RANGE_DAYS[range];
    setLoading(true);
    setHover(null);

    Promise.all([
      api.getGlycemiaStats(days),
      api.getGlycemiaChart(days),
    ]).then(([nextStats, chart]) => {
      if (!alive) return;
      setStats(nextStats);
      setPoints(chart.points);
      setChartMode(chart.mode);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [range, target.min, target.max]);

  useEffect(() => {
    let alive = true;
    api.getRecentGlycemiaReadings(recentCount).then(recent => {
      if (alive) setRecentReadings(recent);
    });
    return () => { alive = false; };
  }, [recentCount, target.min, target.max]);

  const avgGlycemia = stats?.avgGlycemia ?? null;
  const tir = stats?.tir ?? null;
  const gmi = stats?.gmi ?? null;

  const maxMinute = points.at(-1)?.minute ?? (chartMode === 'hourly' ? 1440 : 1);

  const proj = useMemo(
    () => points.map(p => ({ x: (p.minute / maxMinute) * CHART_W, y: toY(p.value) })),
    [points, maxMinute],
  );

  const segments = useMemo(
    () => proj.slice(0, -1).map((p, i) => ({
      key: i,
      x1: p.x,
      y1: p.y,
      x2: proj[i + 1].x,
      y2: proj[i + 1].y,
      color: zoneColor(points[i].value, points[i + 1].value, target.min, target.max),
    })),
    [proj, points, target.min, target.max],
  );

  const tooltipEnabled = range === '24h' && chartMode === 'hourly';

  function handleMove(e: MouseEvent<SVGSVGElement>) {
    if (!tooltipEnabled || !proj.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < proj.length; i++) {
      const d = Math.abs(proj[i].x - vbX);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHover(best);
  }

  const hoverPoint = tooltipEnabled && hover != null ? proj[hover] : null;
  const hoverData = tooltipEnabled && hover != null ? points[hover] : null;

  const yTargetMax = toY(target.max);
  const yTargetMin = toY(target.min);

  const xLabels = chartMode === 'hourly'
    ? ['00:00', '06:00', '12:00', '18:00', 'Teraz']
    : range === '7d'
      ? ['D-6', 'D-4', 'D-2', 'Dziś']
      : range === '14d'
        ? ['D-13', 'D-9', 'D-5', 'Dziś']
        : ['D-29', 'D-20', 'D-10', 'Dziś'];

  const avgDisplay = avgGlycemia == null ? '—' : convertGlycemia(avgGlycemia, unit);
  const targetMinDisp = convertGlycemia(target.min, unit);
  const targetMaxDisp = convertGlycemia(target.max, unit);
  const yAxisLabels = [...[250, 180, 70].map(v => convertGlycemia(v, unit)), 0];
  const hasMoreReadings = recentReadings.length >= recentCount;

  return (
    <div className="glycemia">
      <header className="glycemia__header">
        <h1>Glikemia</h1>
        <p>Analiza trendów i statystyki wyrównania.</p>
      </header>

      <div className="glycemia__rangeScroll" role="group" aria-label="Zakres czasu">
        {RANGES.map(r => (
          <button
            key={r.id}
            type="button"
            className={`glycemia__pill ${range === r.id ? 'glycemia__pill--active' : ''}`}
            onClick={() => setRange(r.id)}
            aria-pressed={range === r.id}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="glycemia__bento">
        <Card className="glycemia__tirCard">
          <div className="glycemia__tirRow">
            <span className="glycemia__tirTitle">Czas w celu (TIR)</span>
            <Icon name="shieldCheck" size={20} className="glycemia__tirIcon" />
          </div>
          <div className="glycemia__tirValueRow">
            <span className="glycemia__tirNumber">{loading ? '—' : tir}</span>
            <span className="glycemia__tirPct">%</span>
          </div>
          <div className="glycemia__tirBarTrack">
            <div className="glycemia__tirBarFill" style={{ width: `${tir ?? 0}%` }} />
          </div>
          <p className="glycemia__tirGoal">Cel: &gt; 70% w zakresie {targetMinDisp}–{targetMaxDisp} {unit}</p>
        </Card>

        <Card className="glycemia__statCard">
          <p className="glycemia__statLabel">Średnia<br />glikemia</p>
          <div className="glycemia__statValueRow">
            <span className="glycemia__statNumber">{loading ? '—' : avgDisplay}</span>
          </div>
          <p className="glycemia__statUnit">{unit}</p>
        </Card>

        <Card className="glycemia__statCard">
          <p className="glycemia__statLabel">Szacowane<br />HbA1c</p>
          <div className="glycemia__statValueRow">
            <span className="glycemia__statNumber">{loading ? '—' : gmi ?? '—'}</span>
          </div>
          <p className="glycemia__statUnit">% (GMI)</p>
        </Card>
      </div>

      <Card className="glycemia__chartCard">
        <h2 className="glycemia__chartTitle">{CHART_LABELS[range]}</h2>
        <div className="glycemia__chartArea">
          <div className="glycemia__yLabels" aria-hidden="true">
            {yAxisLabels.map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
          <div className="glycemia__svgContainer">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              className="glycemia__svg"
              aria-label={CHART_LABELS[range]}
              onMouseMove={handleMove}
              onMouseLeave={() => setHover(null)}
            >
              <rect x={0} y={yTargetMax} width={CHART_W} height={yTargetMin - yTargetMax} fill="rgba(136,217,130,0.12)" />
              <line x1={0} y1={yTargetMax} x2={CHART_W} y2={yTargetMax}
                stroke="rgba(51,130,54,0.3)" strokeDasharray="4 4" strokeWidth={1} />
              <line x1={0} y1={yTargetMin} x2={CHART_W} y2={yTargetMin}
                stroke="rgba(51,130,54,0.3)" strokeDasharray="4 4" strokeWidth={1} />
              {segments.map(s => (
                <line
                  key={s.key}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
              {hoverPoint && (
                <>
                  <line
                    x1={hoverPoint.x}
                    x2={hoverPoint.x}
                    y1={0}
                    y2={CHART_H}
                    stroke="var(--color-primary-500)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.6}
                  />
                  <circle cx={hoverPoint.x} cy={hoverPoint.y} r={4}
                    fill="var(--color-primary-500)" stroke="#fff" strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke" />
                </>
              )}
            </svg>
            {hoverPoint && hoverData && (
              <div
                className="glycemia__tooltip"
                style={{
                  left: `${(hoverPoint.x / CHART_W) * 100}%`,
                  top: `${hoverPoint.y}px`,
                }}
              >
                <span className="glycemia__tooltipTime">{formatMinute(hoverData.minute)}</span>
                <span className="glycemia__tooltipValue">{convertGlycemia(hoverData.value, unit)} {unit}</span>
              </div>
            )}
            <div className="glycemia__xLabels" aria-hidden="true">
              {xLabels.map(label => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <section className="glycemia__section">
        <h2 className="glycemia__sectionTitle">Ostatnie pomiary</h2>
        <Card padded={false}>
          {recentReadings.map(r => (
            <div key={r.id} className="glycemia__readingRow">
              <span
                className="glycemia__readingDot"
                style={{
                  background: r.status === 'ok'
                    ? 'var(--color-tertiary-500)'
                    : r.status === 'high'
                      ? 'var(--color-warning-500)'
                      : 'var(--color-danger-500)',
                }}
              />
              <div className="glycemia__readingInfo">
                <span className="glycemia__readingValue">
                  {convertGlycemia(r.value, unit)}{' '}
                  <span className="glycemia__readingUnit">{unit}</span>
                </span>
                <span className="glycemia__readingTime">{r.time}</span>
              </div>
            </div>
          ))}
          {hasMoreReadings && (
            <button
              type="button"
              className="glycemia__showMore"
              onClick={() => setRecentCount(c => c + RECENT_STEP)}
            >
              Pokaż więcej historii
            </button>
          )}
          {recentCount > 3 && (
            <button
              type="button"
              className="glycemia__showMore"
              onClick={() => setRecentCount(3)}
            >
              Zwiń
            </button>
          )}
        </Card>
      </section>

      <div className="glycemia__actions">
        <Button fullWidth onClick={onShowReports} iconLeft={<Icon name="database" size={18} />}>
          Generuj PDF
        </Button>
      </div>
    </div>
  );
}
