import { useState, type FormEvent } from 'react';
import { Icon } from '../../components';
import { useUnit, convertGlycemia } from '../../contexts/UnitContext';
import { useGlycemiaTarget } from '../../contexts/GlycemiaTargetContext';
import './GlycemiaTargetEditView.css';

type Props = {
  onBack: () => void;
};

const MMOLL_TO_MGDL = 1 / 0.0555;

function toDisplay(mgdl: number, unit: 'mg/dL' | 'mmol/L'): string {
  return convertGlycemia(mgdl, unit).toString();
}

function toMgdl(val: number, unit: 'mg/dL' | 'mmol/L'): number {
  return unit === 'mmol/L' ? Math.round(val * MMOLL_TO_MGDL) : Math.round(val);
}

export function GlycemiaTargetEditView({ onBack }: Props) {
  const { unit } = useUnit();
  const { target, setTarget } = useGlycemiaTarget();

  const [minVal, setMinVal] = useState(toDisplay(target.min, unit));
  const [maxVal, setMaxVal] = useState(toDisplay(target.max, unit));
  const [error, setError] = useState<string | null>(null);

  const unitMin = unit === 'mmol/L' ? 2.2  : 40;
  const unitMax = unit === 'mmol/L' ? 22.2 : 400;
  const step    = unit === 'mmol/L' ? 0.1  : 1;

  function validate(min: number, max: number): string | null {
    if (isNaN(min) || isNaN(max)) return 'Podaj prawidłowe wartości liczbowe.';
    const minMg = toMgdl(min, unit);
    const maxMg = toMgdl(max, unit);
    if (minMg < 40)  return `Wartość minimalna nie może być niższa niż ${unit === 'mmol/L' ? '2.2 mmol/L' : '40 mg/dL'}.`;
    if (maxMg > 400) return `Wartość maksymalna nie może być wyższa niż ${unit === 'mmol/L' ? '22.2 mmol/L' : '400 mg/dL'}.`;
    if (minMg >= maxMg) return 'Wartość minimalna musi być niższa od maksymalnej.';
    if (maxMg - minMg < (unit === 'mmol/L' ? 0.5 * MMOLL_TO_MGDL : 10))
      return 'Zakres musi wynosić co najmniej ' + (unit === 'mmol/L' ? '0.5 mmol/L.' : '10 mg/dL.');
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const min = parseFloat(minVal);
    const max = parseFloat(maxVal);
    const err = validate(min, max);
    if (err) { setError(err); return; }
    setTarget({ min: toMgdl(min, unit), max: toMgdl(max, unit) });
    onBack();
  }

  return (
    <div className="targetEdit">
      <header className="targetEdit__header">
        <button type="button" className="targetEdit__back" onClick={onBack} aria-label="Wróć">
          <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="targetEdit__title">Cel glikemii</h1>
      </header>

      <div className="targetEdit__body">
        <p className="targetEdit__desc">
          Ustaw docelowy zakres glikemii. Strefa ta jest zaznaczona na wykresie i służy do obliczania TIR.
        </p>

        <form onSubmit={handleSubmit} className="targetEdit__form" noValidate>

          <div className="targetEdit__field">
            <label className="targetEdit__label" htmlFor="target-min">
              Wartość minimalna ({unit})
            </label>
            <div className="targetEdit__inputRow">
              <input
                id="target-min"
                className={`targetEdit__input ${error ? 'targetEdit__input--error' : ''}`}
                type="number"
                min={unitMin}
                max={unitMax}
                step={step}
                value={minVal}
                onChange={e => { setMinVal(e.target.value); setError(null); }}
              />
              <span className="targetEdit__unit">{unit}</span>
            </div>
          </div>

          <div className="targetEdit__field">
            <label className="targetEdit__label" htmlFor="target-max">
              Wartość maksymalna ({unit})
            </label>
            <div className="targetEdit__inputRow">
              <input
                id="target-max"
                className={`targetEdit__input ${error ? 'targetEdit__input--error' : ''}`}
                type="number"
                min={unitMin}
                max={unitMax}
                step={step}
                value={maxVal}
                onChange={e => { setMaxVal(e.target.value); setError(null); }}
              />
              <span className="targetEdit__unit">{unit}</span>
            </div>
          </div>

          {error && <p className="targetEdit__error">{error}</p>}

          <div className="targetEdit__preview">
            <span className="targetEdit__previewLabel">Podgląd zakresu</span>
            <span className="targetEdit__previewValue">
              {minVal || '—'} – {maxVal || '—'} {unit}
            </span>
          </div>

          <div className="targetEdit__actions">
            <button type="button" className="targetEdit__btnSecondary" onClick={onBack}>
              Anuluj
            </button>
            <button type="submit" className="targetEdit__btnPrimary">
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
