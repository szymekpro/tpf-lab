import { useMemo, useState } from 'react';
import './InsulinView.css';

const CURRENT_GLUCOSE = 142;
const ACTIVE_INSULIN = 1.8;
const TARGET_GLUCOSE = 110;
const SENSITIVITY_FACTOR = 25; // ile mg/dL zbija 1j insuliny
const WW_FACTOR = 0.6; // dawka na 1 WW
const WBT_FACTOR = 0.4; // dawka na 1 WBT

function formatUnit(value: number) {
  return value.toFixed(1);
}

function clampMin(value: number, min = 0) {
  return value < min ? min : value;
}

export function InsulinView() {
  const [search, setSearch] = useState('');
  const [ww, setWw] = useState(4.5);
  const [wbt, setWbt] = useState(1.2);

  const mealDose = useMemo(() => {
    return ww * WW_FACTOR + wbt * WBT_FACTOR;
  }, [ww, wbt]);

  const correctionDose = useMemo(() => {
    return Math.max(0, (CURRENT_GLUCOSE - TARGET_GLUCOSE) / SENSITIVITY_FACTOR);
  }, []);

  const suggestedDose = useMemo(() => {
    return mealDose + correctionDose;
  }, [mealDose, correctionDose]);

  function changeWw(delta: number) {
    setWw((prev) => clampMin(Number((prev + delta).toFixed(1))));
  }

  function changeWbt(delta: number) {
    setWbt((prev) => clampMin(Number((prev + delta).toFixed(1))));
  }

  function handleSave() {
    alert(
      `Zapisano dawkę ${formatUnit(suggestedDose)} j\n\n` +
        `Posiłkowy: ${formatUnit(mealDose)} j\n` +
        `Korekcyjny: ${formatUnit(correctionDose)} j`
    );
  }

  return (
    <section className="insulin">
      <header className="insulin__header">
        <h1>Kalkulator bolusa</h1>
      </header>

      <section className="insulin__card">
        <p className="insulin__eyebrow">Aktualna glikemia</p>
        <div className="insulin__glucoseRow">
          <strong>{CURRENT_GLUCOSE}</strong>
          <span>mg/dL</span>
        </div>
      </section>

      <section className="insulin__activeCard">
        <div className="insulin__activeIcon">⚕</div>
        <p>
          Aktywna insulina: <strong>{formatUnit(ACTIVE_INSULIN)}j</strong>
        </p>
      </section>

      <section className="insulin__card">
        <p className="insulin__eyebrow">Dane posiłku</p>

        <label className="insulin__search">
          <span className="insulin__searchIcon">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Wyszukaj produkt lub potrawę..."
          />
        </label>

        <div className="insulin__counters">
          <div className="insulin__counterBox">
            <span className="insulin__counterLabel">Wymienniki WW</span>

            <div className="insulin__stepper">
              <button type="button" onClick={() => changeWw(-0.5)}>
                −
              </button>

              <strong>{formatUnit(ww)}</strong>

              <button type="button" onClick={() => changeWw(0.5)}>
                +
              </button>
            </div>
          </div>

          <div className="insulin__counterBox">
            <span className="insulin__counterLabel">Wymienniki WBT</span>

            <div className="insulin__stepper">
              <button type="button" onClick={() => changeWbt(-0.1)}>
                −
              </button>

              <strong>{formatUnit(wbt)}</strong>

              <button type="button" onClick={() => changeWbt(0.1)}>
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="insulin__doseCard">
        <p className="insulin__doseTitle">Sugerowana dawka</p>

        <div className="insulin__doseValue">
          <strong>{formatUnit(suggestedDose)}</strong>
          <span>j</span>
        </div>

        <div className="insulin__doseDetails">
          <div>
            <span>posiłkowy:</span>
            <strong>{formatUnit(mealDose)}j</strong>
          </div>

          <div>
            <span>korekcyjny:</span>
            <strong>{formatUnit(correctionDose)}j</strong>
          </div>
        </div>
      </section>

      <button className="insulin__saveButton" type="button" onClick={handleSave}>
        <span className="insulin__saveIcon">✓</span>
        Zapisz i podaj
      </button>
    </section>
  );
}