import { useEffect, useState } from 'react';
import { Card, Button, Icon } from '../../components';
import { api } from '../../mocks';
import type { AgpBucket, GlycemiaPeriodDays, GlycemiaStats } from '../../mocks';
import { useUnit, convertGlycemia } from '../../contexts/UnitContext';
import { useGlycemiaTarget } from '../../contexts/GlycemiaTargetContext';
import { AGP_H, AGP_W, agpBandPath, agpLinePath, agpY } from './agp';
import { openPrintableReport } from './reportDocument';
import './ReportsView.css';

type Period = 7 | 14 | 30;

const PERIODS: { id: Period; label: string }[] = [
  { id: 7,  label: '7 dni' },
  { id: 14, label: '14 dni' },
  { id: 30, label: '30 dni' },
];

const R = 54;
const CIRC = 2 * Math.PI * R;

type Props = {
  onBack: () => void;
};

export function ReportsView({ onBack }: Props) {
  const { unit } = useUnit();
  const { target } = useGlycemiaTarget();
  const [period, setPeriod] = useState<Period>(14);
  const [stats, setStats] = useState<GlycemiaStats | null>(null);
  const [agp, setAgp] = useState<AgpBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfPending, setPdfPending] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.getGlycemiaStats(period), api.getAgpProfile(period)]).then(([next, profile]) => {
      if (!alive) return;
      setStats(next);
      setAgp(profile);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [period, target.min, target.max]);

  async function handleGeneratePdf() {
    setPdfPending(true);
    try {
      const data = await api.getReportData(period as GlycemiaPeriodDays);
      openPrintableReport(data, unit);
    } finally {
      setPdfPending(false);
    }
  }

  async function handleShare() {
    if (!stats) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Raport DiabetCare',
          text: `Raport glikemii (${period} dni) – TIR: ${stats.tir}%, Średnia: ${convertGlycemia(stats.avgGlycemia, unit)} ${unit}`,
        });
      } catch {
      }
    } else {
      alert('Udostępnianie niedostępne w tej przeglądarce.');
    }
  }

  const tir = stats?.tir ?? 0;
  const above = stats?.above ?? 0;
  const below = stats?.below ?? 0;
  const avgGlycemia = stats?.avgGlycemia ?? 0;
  const hba1c = stats?.gmi ?? 0;

  const avgDisplay = convertGlycemia(avgGlycemia, unit);
  const targetMinDisp = convertGlycemia(target.min, unit);
  const targetMaxDisp = convertGlycemia(target.max, unit);

  const agpYMax = agpY(target.max);
  const agpYMin = agpY(target.min);
  const agpBandOuter = agpBandPath(agp, 'p90', 'p10');
  const agpBandInner = agpBandPath(agp, 'p75', 'p25');
  const agpMedian = agpLinePath(agp, 'p50');

  const tirLen   = (tir   / 100) * CIRC;
  const aboveLen = (above / 100) * CIRC;
  const belowLen = (below / 100) * CIRC;

  return (
    <div className="reports">
      <header className="reports__header">
        <button type="button" className="reports__back" onClick={onBack} aria-label="Wróć do Glikemii">
          <Icon name="arrowRight" size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1>Raporty</h1>
      </header>

      <div className="reports__segmented" role="group" aria-label="Okres raportu">
        {PERIODS.map(p => (
          <button
            key={p.id}
            type="button"
            className={`reports__segment ${period === p.id ? 'reports__segment--active' : ''}`}
            onClick={() => setPeriod(p.id)}
            aria-pressed={period === p.id}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card className="reports__tirCard">
        <div className="reports__tirTopRow">
          <div className="reports__tirDonut">
            <svg viewBox="0 0 140 140" className="reports__donutSvg" aria-hidden="true">
              <circle cx={70} cy={70} r={R} fill="none" stroke="var(--color-neutral-200)" strokeWidth={16} />
              <circle
                cx={70} cy={70} r={R}
                fill="none"
                stroke="var(--color-danger-500)"
                strokeWidth={16}
                strokeDasharray={`${belowLen} ${CIRC}`}
                strokeDashoffset={-(tirLen + aboveLen)}
                transform="rotate(-90 70 70)"
              />
              <circle
                cx={70} cy={70} r={R}
                fill="none"
                stroke="#cbe7f5"
                strokeWidth={16}
                strokeDasharray={`${aboveLen} ${CIRC}`}
                strokeDashoffset={-tirLen}
                transform="rotate(-90 70 70)"
              />
              <circle
                cx={70} cy={70} r={R}
                fill="none"
                stroke="#88d982"
                strokeWidth={16}
                strokeDasharray={`${tirLen} ${CIRC}`}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="reports__donutCenter">
              <span className="reports__donutNumber">{loading ? '—' : `${tir}%`}</span>
              <span className="reports__donutLabel">W CELU</span>
            </div>
          </div>

          <div className="reports__tirLegend">
            <div className="reports__legendRow">
              <span className="reports__legendDot" style={{ background: '#88d982' }} />
              <span className="reports__legendText">{`W zakresie (${targetMinDisp}–${targetMaxDisp})`}</span>
              <span className="reports__legendValue">{loading ? '—' : `${tir}%`}</span>
            </div>
            <div className="reports__legendRow">
              <span className="reports__legendDot" style={{ background: '#cbe7f5' }} />
              <span className="reports__legendText">{`Powyżej (>${targetMaxDisp})`}</span>
              <span className="reports__legendValue">{loading ? '—' : `${above}%`}</span>
            </div>
            <div className="reports__legendRow reports__legendRow--last">
              <span className="reports__legendDot" style={{ background: 'var(--color-danger-500)' }} />
              <span className="reports__legendText">{`Poniżej (<${targetMinDisp})`}</span>
              <span className="reports__legendValue">{loading ? '—' : `${below}%`}</span>
            </div>
          </div>
        </div>

        <div className="reports__tirStats">
          <div className="reports__statItem">
            <p className="reports__statLabel">ŚREDNIA GLIKEMIA</p>
            <p className="reports__statValue">
              <strong>{loading ? '—' : avgDisplay}</strong>{' '}
              <span>{unit}</span>
            </p>
          </div>
          <div className="reports__statItem">
            <p className="reports__statLabel">SZAC. HBA1C</p>
            <p className="reports__statValue">
              <strong>{loading ? '—' : hba1c}</strong>{' '}
              <span>%</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="reports__agpCard">
        <h2 className="reports__agpTitle">
          <Icon name="trend" size={18} className="reports__agpIcon" />
          Profil AGP ({period} dni)
        </h2>
        <div className="reports__agpChart">
          <svg viewBox={`0 0 ${AGP_W} ${AGP_H}`} className="reports__agpSvg" preserveAspectRatio="none" aria-label={`Profil AGP z ${period} dni`}>
            <rect x={0} y={agpYMax} width={AGP_W} height={agpYMin - agpYMax} fill="rgba(136,217,130,0.2)" />
            <line x1={0} y1={agpYMax} x2={AGP_W} y2={agpYMax} stroke="rgba(136,217,130,0.5)" strokeDasharray="4 4" strokeWidth={1} />
            <line x1={0} y1={agpYMin} x2={AGP_W} y2={agpYMin} stroke="rgba(136,217,130,0.5)" strokeDasharray="4 4" strokeWidth={1} />
            {agpBandOuter && <path d={agpBandOuter} fill="rgba(8,126,139,0.12)" />}
            {agpBandInner && <path d={agpBandInner} fill="rgba(8,126,139,0.25)" />}
            {agpMedian && (
              <path d={agpMedian} fill="none" stroke="var(--color-primary-500)" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          <div className="reports__agpXLabels" aria-hidden="true">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
        <div className="reports__agpLegend">
          <span className="reports__legendItem"><i className="reports__legendSwatch" style={{ background: 'var(--color-primary-500)' }} /> Mediana</span>
          <span className="reports__legendItem"><i className="reports__legendSwatch" style={{ background: 'rgba(8,126,139,0.25)' }} /> 25–75%</span>
          <span className="reports__legendItem"><i className="reports__legendSwatch" style={{ background: 'rgba(8,126,139,0.12)' }} /> 10–90%</span>
        </div>
      </Card>

      <div className="reports__actions">
        <Button
          fullWidth
          onClick={handleGeneratePdf}
          disabled={pdfPending}
          iconLeft={<Icon name="database" size={18} />}
        >
          {pdfPending ? 'Generowanie…' : 'Generuj PDF'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          className="reports__shareBtn"
          onClick={handleShare}
          iconLeft={<Icon name="arrowRight" size={18} style={{ transform: 'rotate(-45deg)' }} />}
        >
          Udostępnij
        </Button>
      </div>
    </div>
  );
}
