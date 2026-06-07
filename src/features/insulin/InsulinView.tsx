import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components';
import { api } from '../../mocks';
import type {
  AccountProfile,
  DashboardStats,
  GlycemiaSnapshot,
} from '../../mocks';
import type { BolusMealData } from '../meals/MealsTypes';
import './InsulinView.css';

type Props = {
  mealData: BolusMealData | null;
  onGoToMeals: () => void;
};

function formatNumber(value: number): string {
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function clampMin(value: number, min = 0): number {
  return value < min ? min : value;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function parseIcrGramsPerUnit(icr: string | undefined): number {
  if (!icr) {
    return 10;
  }

  const parts = icr.split(':');
  const grams = Number(parts.at(-1));

  return Number.isFinite(grams) && grams > 0 ? grams : 10;
}

export function InsulinView({ mealData, onGoToMeals }: Props) {
  const [glycemia, setGlycemia] =
    useState<GlycemiaSnapshot | null>(null);

  const [profile, setProfile] =
    useState<AccountProfile | null>(null);

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [ww, setWw] = useState(() => mealData?.ww ?? 0);
  const [wbt, setWbt] = useState(() => mealData?.wbt ?? 0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.all([
      api.getCurrentGlycemia(),
      api.getAccountProfile(),
      api.getDashboardStats(),
    ])
      .then(([currentGlycemia, accountProfile, dashboardStats]) => {
        if (!alive) {
          return;
        }

        setGlycemia(currentGlycemia);
        setProfile(accountProfile);
        setStats(dashboardStats);
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  const calculation = useMemo(() => {
    const currentGlycemia = glycemia?.value ?? 0;
    const activeInsulin = stats?.iob ?? 0;
    const isf = profile?.clinical.isf ?? 40;
    const targetMin = profile?.clinical.targetMin ?? 70;
    const targetMax = profile?.clinical.targetMax ?? 180;

    const targetGlycemia = Math.round(
      (targetMin + targetMax) / 2,
    );

    const icrGramsPerUnit = parseIcrGramsPerUnit(
      profile?.clinical.icr,
    );

    const carbsAfterManualAdjustment = ww * 10;

    const mealDose =
      carbsAfterManualAdjustment / icrGramsPerUnit;

    const correctionDose =
      currentGlycemia > targetGlycemia
        ? (currentGlycemia - targetGlycemia) / isf
        : 0;

    const suggestedDose = roundToHalf(
      Math.max(
        0,
        mealDose + correctionDose - activeInsulin,
      ),
    );

    return {
      activeInsulin,
      correctionDose,
      mealDose,
      suggestedDose,
    };
  }, [
    glycemia?.value,
    profile,
    stats?.iob,
    ww,
  ]);

  function changeWw(delta: number) {
    setWw((current) =>
      clampMin(
        Number((current + delta).toFixed(1)),
      ),
    );
  }

  function changeWbt(delta: number) {
    setWbt((current) =>
      clampMin(
        Number((current + delta).toFixed(1)),
      ),
    );
  }

  if (loading) {
    return (
      <section className="insulin">
        <p className="insulin__loading">
          Ładowanie kalkulatora…
        </p>
      </section>
    );
  }

  return (
    <section className="insulin">
      <header className="insulin__header">
        <h1>Kalkulator bolusa</h1>

        <p>
          Symulacja obliczenia dawki na podstawie wybranego posiłku.
        </p>
      </header>

      {!mealData ? (
        <section className="insulin__empty-card">
          <div className="insulin__empty-icon">
            <Icon name="fork" size={26} />
          </div>

          <h2>Nie wybrano posiłku</h2>

          <p>
            Przejdź do zakładki Posiłki, dodaj produkty i wybierz opcję
            „Oblicz bolus dla tego posiłku”.
          </p>

          <button type="button" onClick={onGoToMeals}>
            Przejdź do posiłków
            <Icon name="arrowRight" size={17} />
          </button>
        </section>
      ) : (
        <>
          <section className="insulin__meal-card">
            <div>
              <p className="insulin__eyebrow">
                Wybrany posiłek
              </p>

              <h2>{mealData.mealName}</h2>

              <small>
                {mealData.products.length}{' '}
                {mealData.products.length === 1
                  ? 'produkt'
                  : 'produkty'}{' '}
                · {mealData.carbs.toLocaleString('pl-PL')} g węglowodanów ·{' '}
                {mealData.calories} kcal
              </small>
            </div>

            <button type="button" onClick={onGoToMeals}>
              Zmień
            </button>
          </section>

          <section className="insulin__card">
            <p className="insulin__eyebrow">
              Aktualna glikemia
            </p>

            <div className="insulin__glucose-row">
              <strong>{glycemia?.value ?? '—'}</strong>
              <span>mg/dL</span>
            </div>
          </section>

          <section className="insulin__active-card">
            <Icon name="syringe" size={19} />

            <p>
              Aktywna insulina:{' '}
              <strong>
                {formatNumber(calculation.activeInsulin)} j
              </strong>
            </p>
          </section>

          <section className="insulin__card">
            <p className="insulin__eyebrow">
              Dane posiłku
            </p>

            <p className="insulin__description">
              Wartości zostały pobrane z zapisanego posiłku. Możesz
              skorygować je ręcznie przed wykonaniem symulacji.
            </p>

            <div className="insulin__counters">
              <div className="insulin__counter-box">
                <span className="insulin__counter-label">
                  Wymienniki WW
                </span>

                <div className="insulin__stepper">
                  <button
                    type="button"
                    onClick={() => changeWw(-0.1)}
                    aria-label="Zmniejsz WW"
                  >
                    −
                  </button>

                  <strong>{formatNumber(ww)}</strong>

                  <button
                    type="button"
                    onClick={() => changeWw(0.1)}
                    aria-label="Zwiększ WW"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="insulin__counter-box">
                <span className="insulin__counter-label">
                  Wymienniki WBT
                </span>

                <div className="insulin__stepper">
                  <button
                    type="button"
                    onClick={() => changeWbt(-0.1)}
                    aria-label="Zmniejsz WBT"
                  >
                    −
                  </button>

                  <strong>{formatNumber(wbt)}</strong>

                  <button
                    type="button"
                    onClick={() => changeWbt(0.1)}
                    aria-label="Zwiększ WBT"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="insulin__dose-card">
            <p className="insulin__dose-title">
              Symulowana dawka
            </p>

            <div className="insulin__dose-value">
              <strong>
                {formatNumber(calculation.suggestedDose)}
              </strong>

              <span>j</span>
            </div>

            <div className="insulin__dose-details">
              <div>
                <span>posiłkowy:</span>

                <strong>
                  {formatNumber(calculation.mealDose)} j
                </strong>
              </div>

              <div>
                <span>korekcyjny:</span>

                <strong>
                  {formatNumber(calculation.correctionDose)} j
                </strong>
              </div>

              <div>
                <span>aktywna insulina:</span>

                <strong>
                  − {formatNumber(calculation.activeInsulin)} j
                </strong>
              </div>
            </div>
          </section>

          <button
            className="insulin__save-button"
            type="button"
            onClick={() => setSaved(true)}
          >
            <Icon name="shieldCheck" size={18} />

            {saved
              ? 'Symulacja została zapisana'
              : 'Zapisz symulację'}
          </button>
        </>
      )}
    </section>
  );
}