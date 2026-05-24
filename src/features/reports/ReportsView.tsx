import { useState } from 'react';
import { Card, Button, Icon } from '../../components';
import './ReportsView.css';

type Period = 7 | 14 | 30 | 90;

const PERIODS: { id: Period; label: string }[] = [
  { id: 7,  label: '7 dni' },
  { id: 14, label: '14 dni' },
  { id: 30, label: '30 dni' },
  { id: 90, label: '90 dni' },
];

const STATS = {
  tir: 72,
  above: 24,
  below: 4,
  avgGlycemia: 138,
  hba1c: 6.4,
};

const R = 54;
const CIRC = 2 * Math.PI * R;

type Props = {
  onBack: () => void;
};

export function ReportsView({ onBack }: Props) {
  const [period, setPeriod] = useState<Period>(14);

  function handleGeneratePdf() {
    window.print();
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Raport DiabetCare',
          text: `Raport glikemii (${period} dni) – TIR: ${STATS.tir}%, Średnia: ${STATS.avgGlycemia} mg/dL`,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      alert('Udostępnianie niedostępne w tej przeglądarce.');
    }
  }

  const tirLen   = (STATS.tir   / 100) * CIRC;
  const aboveLen = (STATS.above / 100) * CIRC;
  const belowLen = (STATS.below / 100) * CIRC;

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
              {/* background ring */}
              <circle cx={70} cy={70} r={R} fill="none" stroke="var(--color-neutral-200)" strokeWidth={16} />
              {/* below range – red */}
              <circle
                cx={70} cy={70} r={R}
                fill="none"
                stroke="var(--color-danger-500)"
                strokeWidth={16}
                strokeDasharray={`${belowLen} ${CIRC}`}
                strokeDashoffset={-(tirLen + aboveLen)}
                transform="rotate(-90 70 70)"
              />
              {/* above range – light blue */}
              <circle
                cx={70} cy={70} r={R}
                fill="none"
                stroke="#cbe7f5"
                strokeWidth={16}
                strokeDasharray={`${aboveLen} ${CIRC}`}
                strokeDashoffset={-tirLen}
                transform="rotate(-90 70 70)"
              />
              {/* TIR – green */}
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
              <span className="reports__donutNumber">{STATS.tir}%</span>
              <span className="reports__donutLabel">W CELU</span>
            </div>
          </div>

          <div className="reports__tirLegend">
            <div className="reports__legendRow">
              <span className="reports__legendDot" style={{ background: '#88d982' }} />
              <span className="reports__legendText">W zakresie (70–180)</span>
              <span className="reports__legendValue">{STATS.tir}%</span>
            </div>
            <div className="reports__legendRow">
              <span className="reports__legendDot" style={{ background: '#cbe7f5' }} />
              <span className="reports__legendText">{`Powyżej (>180)`}</span>
              <span className="reports__legendValue">{STATS.above}%</span>
            </div>
            <div className="reports__legendRow reports__legendRow--last">
              <span className="reports__legendDot" style={{ background: 'var(--color-danger-500)' }} />
              <span className="reports__legendText">{`Poniżej (<70)`}</span>
              <span className="reports__legendValue">{STATS.below}%</span>
            </div>
          </div>
        </div>

        <div className="reports__tirStats">
          <div className="reports__statItem">
            <p className="reports__statLabel">ŚREDNIA GLIKEMIA</p>
            <p className="reports__statValue">
              <strong>{STATS.avgGlycemia}</strong>{' '}
              <span>mg/dL</span>
            </p>
          </div>
          <div className="reports__statItem">
            <p className="reports__statLabel">SZAC. HBA1C</p>
            <p className="reports__statValue">
              <strong>{STATS.hba1c}</strong>{' '}
              <span>%</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="reports__agpCard">
        <h2 className="reports__agpTitle">
          <Icon name="trend" size={18} className="reports__agpIcon" />
          Profil AGP
        </h2>
        <div className="reports__agpChart">
          <svg viewBox="0 0 300 120" className="reports__agpSvg" aria-label="Profil AGP">
            {/* Target range zone */}
            <rect x={0} y={36} width={300} height={48} fill="rgba(136,217,130,0.2)" />
            <line x1={0} y1={36} x2={300} y2={36} stroke="rgba(136,217,130,0.5)" strokeDasharray="4 4" strokeWidth={1} />
            <line x1={0} y1={84} x2={300} y2={84} stroke="rgba(136,217,130,0.5)" strokeDasharray="4 4" strokeWidth={1} />
            {/* IQR band 25–75% */}
            <path
              d="M0,70 C30,65 60,55 90,50 C120,45 150,40 180,42 C210,44 240,50 270,55 L270,80 C240,78 210,72 180,68 C150,64 120,62 90,65 C60,68 30,72 0,75 Z"
              fill="rgba(8,126,139,0.1)"
            />
            {/* 10/90 percentile dashed */}
            <path
              d="M0,62 C30,56 60,44 90,38 C120,32 150,28 180,30 C210,32 240,40 270,46"
              fill="none" stroke="rgba(8,126,139,0.3)" strokeWidth={1} strokeDasharray="3 3"
            />
            <path
              d="M0,82 C30,80 60,74 90,72 C120,70 150,66 180,68 C210,70 240,74 270,78"
              fill="none" stroke="rgba(8,126,139,0.3)" strokeWidth={1} strokeDasharray="3 3"
            />
            {/* Median */}
            <path
              d="M0,72 C30,68 60,58 90,54 C120,50 150,46 180,48 C210,50 240,56 270,62"
              fill="none" stroke="var(--color-primary-500)" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <div className="reports__agpXLabels" aria-hidden="true">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
      </Card>

      <div className="reports__actions">
        <Button
          fullWidth
          onClick={handleGeneratePdf}
          iconLeft={<Icon name="database" size={18} />}
        >
          Generuj PDF
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
