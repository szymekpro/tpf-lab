import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Icon } from '../../components';
import { api } from '../../mocks';
import type { GlycemiaPoint, DashboardStats } from '../../mocks';
import './GlycemiaView.css';

type Range = '24h' | '7d' | '14d' | '30d';

const RANGES: { id: Range; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d',  label: '7 dni' },
  { id: '14d', label: '14 dni' },
  { id: '30d', label: '30 dni' },
];

const RECENT_READINGS = [
  { id: '1', value: 105, time: 'Dzisiaj, 14:30', status: 'ok'   as const },
  { id: '2', value: 112, time: 'Dzisiaj, 14:25', status: 'ok'   as const },
  { id: '3', value: 185, time: 'Dzisiaj, 13:10', status: 'high' as const },
];

type Props = {
  onShowReports: () => void;
};

const CHART_W = 300;
const CHART_H = 200;
const MAX_VAL = 300;

function toY(v: number) {
  return CHART_H - (v / MAX_VAL) * CHART_H;
}

export function GlycemiaView({ onShowReports }: Props) {
  const [range, setRange] = useState<Range>('24h');
  const [points, setPoints] = useState<GlycemiaPoint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getGlycemia24h().then(setPoints);
    api.getDashboardStats().then(setStats);
  }, []);

  const avgGlycemia = useMemo(() => {
    if (!points.length) return null;
    return Math.round(points.reduce((s, p) => s + p.value, 0) / points.length);
  }, [points]);

  const polyline = useMemo(
    () => points.map(p => `${(p.minute / 1440) * CHART_W},${toY(p.value)}`).join(' '),
    [points],
  );

  const tir = stats?.tir ?? 82;
  const gmi = stats?.gmi ?? 6.2;
  const y180 = toY(180);
  const y70  = toY(70);

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
            <span className="glycemia__tirNumber">{tir}</span>
            <span className="glycemia__tirPct">%</span>
          </div>
          <div className="glycemia__tirBarTrack">
            <div className="glycemia__tirBarFill" style={{ width: `${tir}%` }} />
          </div>
          <p className="glycemia__tirGoal">Cel: &gt; 70% w zakresie 70–180 mg/dL</p>
        </Card>

        <Card className="glycemia__statCard">
          <p className="glycemia__statLabel">Średnia<br />glikemia</p>
          <div className="glycemia__statValueRow">
            <span className="glycemia__statNumber">{avgGlycemia ?? '—'}</span>
          </div>
          <p className="glycemia__statUnit">mg/dL</p>
        </Card>

        <Card className="glycemia__statCard">
          <p className="glycemia__statLabel">Szacowane<br />HbA1c</p>
          <div className="glycemia__statValueRow">
            <span className="glycemia__statNumber">{gmi}</span>
          </div>
          <p className="glycemia__statUnit">% (GMI)</p>
        </Card>
      </div>

      <Card className="glycemia__chartCard">
        <h2 className="glycemia__chartTitle">Wykres 24h</h2>
        <div className="glycemia__chartArea">
          <div className="glycemia__yLabels" aria-hidden="true">
            <span>250</span>
            <span>180</span>
            <span>70</span>
            <span>0</span>
          </div>
          <div className="glycemia__svgContainer">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              className="glycemia__svg"
              aria-label="Wykres glikemii 24h"
            >
              <rect x={0} y={y180} width={CHART_W} height={y70 - y180} fill="rgba(136,217,130,0.12)" />
              <line x1={0} y1={y180} x2={CHART_W} y2={y180}
                stroke="rgba(51,130,54,0.3)" strokeDasharray="4 4" strokeWidth={1} />
              <line x1={0} y1={y70} x2={CHART_W} y2={y70}
                stroke="rgba(51,130,54,0.3)" strokeDasharray="4 4" strokeWidth={1} />
              {polyline && (
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="var(--color-primary-500)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="glycemia__xLabels" aria-hidden="true">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>Teraz</span>
            </div>
          </div>
        </div>
      </Card>

      <section className="glycemia__section">
        <h2 className="glycemia__sectionTitle">Ostatnie pomiary</h2>
        <Card padded={false}>
          {RECENT_READINGS.map(r => (
            <div key={r.id} className="glycemia__readingRow">
              <span
                className="glycemia__readingDot"
                style={{ background: r.status === 'ok' ? 'var(--color-tertiary-500)' : 'var(--color-warning-500)' }}
              />
              <div className="glycemia__readingInfo">
                <span className="glycemia__readingValue">
                  {r.value}{' '}
                  <span className="glycemia__readingUnit">mg/dL</span>
                </span>
                <span className="glycemia__readingTime">{r.time}</span>
              </div>
            </div>
          ))}
          <button type="button" className="glycemia__showMore">
            Pokaż więcej historii
          </button>
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
