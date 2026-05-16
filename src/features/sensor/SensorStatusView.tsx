import { useState, useEffect, type FormEvent } from 'react';
import { Icon } from '../../components';
import { useUnit, convertGlycemia } from '../../contexts/UnitContext';
import { api, type CalibrationEntry, type GlycemiaSnapshot, type SensorStatus } from '../../mocks';
import './SensorStatusView.css';

type Props = {
  onBack: () => void;
};

const HISTORY_PREVIEW = 3;

function formatNowLabel(): string {
  const now = new Date();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  if (now.toDateString() === today.toDateString()) return `Dzisiaj, ${time}`;
  if (now.toDateString() === yesterday.toDateString()) return `Wczoraj, ${time}`;

  return now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) + `, ${time}`;
}

export function SensorStatusView({ onBack }: Props) {
  const { unit } = useUnit();
  const [status, setStatus] = useState<SensorStatus | null>(null);
  const [snap, setSnap] = useState<GlycemiaSnapshot | null>(null);
  const [history, setHistory] = useState<CalibrationEntry[]>([]);
  const [calibValue, setCalibValue] = useState('');
  const [calibPending, setCalibPending] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getSensorStatus(), api.getCurrentGlycemia()]).then(([s, g]) => {
      if (!alive) return;
      setStatus(s);
      setHistory(s.calibrationHistory);
      setSnap(g);
    });
    return () => { alive = false; };
  }, []);

  async function handleCalibrate(e: FormEvent) {
    e.preventDefault();
    const val = Number(calibValue);
    if (!calibValue || isNaN(val)) return;

    // Przelicz do mg/dL jeśli użytkownik wpisał mmol/L
    const valMgdl = unit === 'mmol/L' ? Math.round(val / 0.0555) : val;
    if (valMgdl < 40 || valMgdl > 400) return;

    setCalibPending(true);
    try {
      const newSnap = await api.calibrate(valMgdl);
      setSnap(newSnap);

      const newEntry: CalibrationEntry = {
        label: formatNowLabel(),
        source: 'Glukometr',
        value: val,         // zapisujemy w jednostce użytkownika
      };
      setHistory(prev => [newEntry, ...prev]);
      setCalibValue('');
    } finally {
      setCalibPending(false);
    }
  }

  const visibleHistory = showAll ? history : history.slice(0, HISTORY_PREVIEW);
  const hasMore = history.length > HISTORY_PREVIEW;

  return (
    <div className="sensorView">

      {/* Header */}
      <header className="sensorView__header">
        <button type="button" className="sensorView__back" onClick={onBack} aria-label="Wróć">
          <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="sensorView__title">Sensor CGM</h1>
      </header>

      <div className="sensorView__body">

        {/* Karta statusu */}
        <div className="sensorCard">
          <div className="sensorCard__bg" aria-hidden="true" />
          <div className="sensorCard__row">
            <div className="sensorCard__left">
              <div className="sensorCard__iconWrap">
                <Icon name="signal" size={20} />
              </div>
              <div>
                <span className="sensorCard__model">{status?.model ?? '—'}</span>
                {snap && (
                  <div className="sensorCard__glycemia">
                    <span className="sensorCard__glycemiaVal">{convertGlycemia(snap.value, unit)}</span>
                    <span className="sensorCard__glycemiaUnit">{unit}</span>
                  </div>
                )}
              </div>
            </div>
            <span className={`sensorCard__badge ${status?.online ? 'sensorCard__badge--active' : 'sensorCard__badge--offline'}`}>
              <span className="sensorCard__dot" />
              {status?.online ? 'Aktywny' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Kalibracja */}
        <section className="sensorSection">
          <div className="sensorSection__heading">
            <Icon name="edit" size={18} />
            <h2>Kalibracja</h2>
          </div>
          <p className="sensorSection__desc">
            Wprowadź aktualny wynik pomiaru z glukometru w celu kalibracji sensora.
          </p>
          <form onSubmit={handleCalibrate} className="sensorCalib__form">
            <div className="sensorCalib__fieldWrap">
              <label className="sensorCalib__label" htmlFor="calib-input">
                Wartość glikemii ({unit})
              </label>
              <div className="sensorCalib__inputRow">
                <input
                  id="calib-input"
                  className="sensorCalib__input"
                  type="number"
                  min={unit === 'mmol/L' ? 2.2 : 40}
                  max={unit === 'mmol/L' ? 22.2 : 400}
                  step={unit === 'mmol/L' ? 0.1 : 1}
                  placeholder={unit === 'mmol/L' ? 'np. 5.8' : 'np. 105'}
                  value={calibValue}
                  onChange={e => setCalibValue(e.target.value)}
                />
                <span className="sensorCalib__unit">{unit}</span>
              </div>
            </div>
            <button type="submit" className="sensorCalib__btn" disabled={!calibValue || calibPending}>
              {calibPending ? 'Kalibrowanie…' : 'Skalibruj'}
            </button>
          </form>
        </section>

        {/* Historia kalibracji */}
        <section className="sensorSection">
          <h2 className="sensorSection__historyTitle">Historia kalibracji</h2>
          <ul className="sensorHistory">
            {visibleHistory.map((entry, i) => (
              <li key={i} className="sensorHistory__item">
                <div className="sensorHistory__meta">
                  <span className="sensorHistory__date">{entry.label}</span>
                  <span className="sensorHistory__source">{entry.source}</span>
                </div>
                <div className="sensorHistory__value">
                  <span className="sensorHistory__num">{entry.value}</span>
                  <span className="sensorHistory__unit">{unit}</span>
                </div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              className="sensorSection__link"
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? 'Zwiń historię' : 'Zobacz pełną historię!'}
            </button>
          )}
        </section>

        {/* Instrukcja parowania */}
        <section className="sensorSection">
          <div className="sensorSection__headingBordered">
            <Icon name="bluetooth" size={18} />
            <h2>Instrukcja parowania</h2>
          </div>
          <ol className="sensorSteps">
            <li className="sensorSteps__item">
              <span className="sensorSteps__num">1</span>
              <span className="sensorSteps__text">Wprowadź kod z opakowania nowego sensora.</span>
            </li>
            <li className="sensorSteps__item">
              <span className="sensorSteps__num">2</span>
              <span className="sensorSteps__text">Włącz Bluetooth w telefonie i zbliż go do transmitera.</span>
            </li>
            <li className="sensorSteps__item">
              <span className="sensorSteps__num">3</span>
              <span className="sensorSteps__text">Poczekaj na komunikat o udanym połączeniu (ok. 5 minut).</span>
            </li>
          </ol>
          <button type="button" className="sensorSection__link sensorSection__pairLink">
            Rozpocznij nowe parowanie
          </button>
        </section>

      </div>
    </div>
  );
}
