import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Icon } from '../../components';
import { useUnit, convertGlycemia } from '../../contexts/UnitContext';
import { api, type AlarmEvent } from '../../mocks';
import './AlarmsView.css';

type Props = {
  onBack: () => void;
};

type AlarmSettings = {
  low: number;
  high: number;
  predictive: boolean;
  criticalLoud: boolean;
  vibration: boolean;
};

const STORAGE_KEY = 'diabetcare_alarms';
const DEFAULT_SETTINGS: AlarmSettings = {
  low: 80,
  high: 180,
  predictive: true,
  criticalLoud: true,
  vibration: false,
};

const SCALE_MIN = 40;
const SCALE_MAX = 300;
const STEP = 5;
const CRITICAL_LOW = 55;

const TRAIL_LOW = 'var(--color-danger-500)';
const TRAIL_HIGH = 'var(--color-primary-500)';
const HISTORY_STEP = 3;

function clampThresholds(low: number, high: number): { low: number; high: number } {
  const safeLow = Math.max(SCALE_MIN, Math.min(low, high - STEP));
  const safeHigh = Math.min(SCALE_MAX, Math.max(high, safeLow + STEP));
  return { low: safeLow, high: safeHigh };
}

function trailStyle(value: number, color: string) {
  const pct = ((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
  return {
    background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--color-neutral-200) ${pct}%, var(--color-neutral-200) 100%)`,
  };
}

function loadSettings(): AlarmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AlarmSettings>;
      const low = Number(p.low);
      const high = Number(p.high);
      const bounds = clampThresholds(
        Number.isFinite(low) ? low : DEFAULT_SETTINGS.low,
        Number.isFinite(high) ? high : DEFAULT_SETTINGS.high,
      );
      return {
        ...bounds,
        predictive: p.predictive ?? DEFAULT_SETTINGS.predictive,
        criticalLoud: p.criticalLoud ?? DEFAULT_SETTINGS.criticalLoud,
        vibration: p.vibration ?? DEFAULT_SETTINGS.vibration,
      };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

function playAlarmSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const beep = (start: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    };
    beep(0, 880);
    beep(0.25, 880);
    beep(0.5, 1175);
    window.setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio niedostępne */
  }
}

export function AlarmsView({ onBack }: Props) {
  const { unit } = useUnit();
  const [settings, setSettings] = useState<AlarmSettings>(loadSettings);
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [visibleCount, setVisibleCount] = useState(HISTORY_STEP);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  useEffect(() => {
    let alive = true;
    api.getAlarmEvents(settings.low, settings.high).then(list => {
      if (!alive) return;
      setEvents(list);
      setVisibleCount(HISTORY_STEP);
    });
    return () => { alive = false; };
  }, [settings.low, settings.high]);

  const toggle = useCallback((key: 'predictive' | 'criticalLoud' | 'vibration') => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setLow = useCallback((value: number) => {
    setSettings(prev => ({ ...prev, ...clampThresholds(value, prev.high) }));
  }, []);

  const setHigh = useCallback((value: number) => {
    setSettings(prev => ({ ...prev, ...clampThresholds(prev.low, value) }));
  }, []);

  function handleTest() {
    playAlarmSound();
    if (settings.vibration && 'vibrate' in navigator) navigator.vibrate?.([120, 60, 120]);
    setTested(true);
    window.setTimeout(() => setTested(false), 2500);
  }

  const toggleRows = useMemo(
    () => [
      {
        key: 'predictive' as const,
        title: 'Alarmy predykcyjne',
        subtitle: 'Ostrzegaj 20 min przed przekroczeniem progu',
      },
      {
        key: 'criticalLoud' as const,
        title: 'Głośny alarm krytyczny',
        subtitle: `Omija tryb cichy dla poziomu < ${convertGlycemia(CRITICAL_LOW, unit)} ${unit}`,
      },
      {
        key: 'vibration' as const,
        title: 'Wibracje',
        subtitle: 'Dla wszystkich powiadomień standardowych',
      },
    ],
    [unit],
  );

  return (
    <div className="alarmsView">
      <header className="alarmsView__header">
        <button type="button" className="alarmsView__back" onClick={onBack} aria-label="Wróć">
          <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="alarmsView__title">Powiadomienia i alarmy</h1>
      </header>

      <div className="alarmsView__body">
        <Card className="alarmsThresholds">
          <h2 className="alarmsThresholds__heading">Progi alarmów</h2>

          <div className="alarmsThresholds__row">
            <div className="alarmsThresholds__rowTop">
              <span className="alarmsThresholds__label">Niski (Hipo)</span>
              <span className="alarmsThresholds__value">
                <strong className="alarmsThresholds__num alarmsThresholds__num--low">
                  {convertGlycemia(settings.low, unit)}
                </strong>
                <span className="alarmsThresholds__unit">{unit}</span>
              </span>
            </div>
            <input
              type="range"
              className="alarmsThresholds__slider alarmsThresholds__slider--low"
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={STEP}
              value={settings.low}
              style={trailStyle(settings.low, TRAIL_LOW)}
              onChange={e => setLow(Number(e.target.value))}
              aria-label="Próg niski (Hipo)"
            />
          </div>

          <div className="alarmsThresholds__row">
            <div className="alarmsThresholds__rowTop">
              <span className="alarmsThresholds__label">Wysoki (Hiper)</span>
              <span className="alarmsThresholds__value">
                <strong className="alarmsThresholds__num alarmsThresholds__num--high">
                  {convertGlycemia(settings.high, unit)}
                </strong>
                <span className="alarmsThresholds__unit">{unit}</span>
              </span>
            </div>
            <input
              type="range"
              className="alarmsThresholds__slider alarmsThresholds__slider--high"
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={STEP}
              value={settings.high}
              style={trailStyle(settings.high, TRAIL_HIGH)}
              onChange={e => setHigh(Number(e.target.value))}
              aria-label="Próg wysoki (Hiper)"
            />
          </div>

          <p className="alarmsThresholds__hint">
            Progi alarmów są niezależne od docelowego zakresu glikemii — ustaw je tak, jak chcesz być powiadamiany.
          </p>
        </Card>

        <Card className="alarmsToggles" padded={false}>
          {toggleRows.map((row, i) => (
            <div
              key={row.key}
              className={`alarmsToggle ${i < toggleRows.length - 1 ? 'alarmsToggle--divider' : ''}`}
            >
              <div className="alarmsToggle__text">
                <span className="alarmsToggle__title">{row.title}</span>
                <span className="alarmsToggle__subtitle">{row.subtitle}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[row.key]}
                aria-label={row.title}
                className={`alarmsSwitch ${settings[row.key] ? 'alarmsSwitch--on' : ''}`}
                onClick={() => toggle(row.key)}
              >
                <span className="alarmsSwitch__knob" />
              </button>
            </div>
          ))}
        </Card>

        <button type="button" className="alarmsTest" onClick={handleTest}>
          <Icon name="bell" size={18} />
          <span>{tested ? 'Odtworzono testowy alarm' : 'Testuj alarm'}</span>
        </button>

        <section className="alarmsHistory">
          <h2 className="alarmsHistory__heading">Historia zdarzeń</h2>
          {events.length === 0 && (
            <p className="alarmsHistory__empty">Brak zdarzeń alarmowych dla wybranych progów.</p>
          )}
          {events.slice(0, visibleCount).map(entry => (
            <div key={entry.id} className="alarmsEvent">
              <span className={`alarmsEvent__dot alarmsEvent__dot--${entry.tone}`} />
              <div className="alarmsEvent__text">
                <span className="alarmsEvent__title">{entry.title}</span>
                <span className="alarmsEvent__meta">
                  {entry.time} • {convertGlycemia(entry.value, unit)} {unit}
                </span>
              </div>
            </div>
          ))}
          {visibleCount < events.length && (
            <button
              type="button"
              className="alarmsHistory__more"
              onClick={() => setVisibleCount(c => c + HISTORY_STEP)}
            >
              Pokaż więcej zdarzeń
            </button>
          )}
          {visibleCount > HISTORY_STEP && (
            <button
              type="button"
              className="alarmsHistory__more"
              onClick={() => setVisibleCount(HISTORY_STEP)}
            >
              Zwiń
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
