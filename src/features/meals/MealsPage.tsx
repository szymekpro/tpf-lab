import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components';
import AddMealProductPage from './AddMealProductPage';
import {
  createEmptySavedMeals,
  MEAL_SECTIONS,
} from './MealsTypes';
import type {
  BolusMealData,
  MealId,
  Product,
  SavedMealProduct,
  SavedMeals,
} from './MealsTypes';
import './MealsPage.css';

const STORAGE_KEY = 'diabetcare.saved-meals.v1';

const DAILY_TARGETS = {
  ww: 18,
  wbt: 12,
  carbs: 190,
};

type GlycemicImpact = {
  label: string;
  modifier: 'none' | 'low' | 'medium' | 'high';
  description: string;
};

type Props = {
  onCalculateBolus: (mealData: BolusMealData) => void;
};

function estimateGlycemicImpact(carbs: number): GlycemicImpact {
  if (carbs === 0) {
    return {
      label: 'Brak danych',
      modifier: 'none',
      description: 'Dodaj produkty, aby wyświetlić szacunkowy wpływ.',
    };
  }

  if (carbs < 60) {
    return {
      label: 'Niski',
      modifier: 'low',
      description: 'Szacunkowy wpływ na podstawie zapisanych węglowodanów.',
    };
  }

  if (carbs < 130) {
    return {
      label: 'Umiarkowany',
      modifier: 'medium',
      description: 'Szacunkowy wpływ na podstawie zapisanych węglowodanów.',
    };
  }

  return {
    label: 'Wysoki',
    modifier: 'high',
    description: 'Szacunkowy wpływ na podstawie zapisanych węglowodanów.',
  };
}

function loadSavedMeals(): SavedMeals {
  const emptyMeals = createEmptySavedMeals();

  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return emptyMeals;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<SavedMeals>;

    return {
      breakfast: parsedValue.breakfast ?? [],
      'second-breakfast': parsedValue['second-breakfast'] ?? [],
      lunch: parsedValue.lunch ?? [],
      dinner: parsedValue.dinner ?? [],
      snack: parsedValue.snack ?? [],
      supper: parsedValue.supper ?? [],
    };
  } catch {
    return emptyMeals;
  }
}

function createEntryId(): string {
  if (
    typeof window !== 'undefined' &&
    typeof window.crypto?.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDate(): string {
  const formattedDate = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function calculateMealTotals(products: SavedMealProduct[]) {
  return products.reduce(
    (totals, product) => ({
      calories: totals.calories + product.calories,
      ww: totals.ww + product.ww,
      wbt: totals.wbt + product.wbt,
      carbs: totals.carbs + product.carbs,
    }),
    {
      calories: 0,
      ww: 0,
      wbt: 0,
      carbs: 0,
    },
  );
}

export default function MealsPage({ onCalculateBolus }: Props) {
  const [savedMeals, setSavedMeals] = useState<SavedMeals>(loadSavedMeals);
  const [selectedMealId, setSelectedMealId] = useState<MealId | null>(null);

  const [expandedMeals, setExpandedMeals] = useState<Set<MealId>>(
    () => new Set(),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMeals));
  }, [savedMeals]);

  const totals = useMemo(() => {
    return calculateMealTotals(Object.values(savedMeals).flat());
  }, [savedMeals]);

  const carbsProgress = Math.min(
    100,
    Math.round((totals.carbs / DAILY_TARGETS.carbs) * 100),
  );

  const remainingCarbs = Math.max(0, DAILY_TARGETS.carbs - totals.carbs);
  const glycemicImpact = estimateGlycemicImpact(totals.carbs);

  const selectedMeal = MEAL_SECTIONS.find(
    (meal) => meal.id === selectedMealId,
  );

  function openAddProduct(mealId: MealId) {
    setSelectedMealId(mealId);
  }

  function toggleExpanded(mealId: MealId) {
    setExpandedMeals((current) => {
      const next = new Set(current);

      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }

      return next;
    });
  }

  function saveProducts(mealId: MealId, products: Product[]) {
    const now = new Date().toISOString();

    const entries: SavedMealProduct[] = products.map((product) => ({
      ...product,
      entryId: createEntryId(),
      savedAt: now,
    }));

    setSavedMeals((current) => ({
      ...current,
      [mealId]: [...current[mealId], ...entries],
    }));

    setExpandedMeals((current) => {
      const next = new Set(current);
      next.add(mealId);
      return next;
    });

    setSelectedMealId(null);
  }

  function removeProduct(mealId: MealId, entryId: string) {
    setSavedMeals((current) => ({
      ...current,
      [mealId]: current[mealId].filter(
        (product) => product.entryId !== entryId,
      ),
    }));
  }

  function handleCalculateBolus(
    mealId: MealId,
    mealName: string,
    products: SavedMealProduct[],
  ) {
    onCalculateBolus({
      mealId,
      mealName,
      products,
      ...calculateMealTotals(products),
    });
  }

  if (selectedMeal) {
    return (
      <AddMealProductPage
        mealName={selectedMeal.name}
        onBack={() => setSelectedMealId(null)}
        onSave={(products) => saveProducts(selectedMeal.id, products)}
      />
    );
  }

  return (
    <section className="meals">
      <header className="meals__heading">
        <h1>Posiłki</h1>
      </header>

      <section className="meals__summary">
        <p className="meals__section-label">Podsumowanie dnia</p>

        <div className="meals__balance-card">
          <div className="meals__balance-header">
            <div>
              <h2>Dzisiejsze spożycie</h2>
              <p className="meals__date">{formatDate()}</p>
            </div>

            <div className="meals__carbs-total">
              <strong>{totals.carbs.toLocaleString('pl-PL')}</strong>
              <span>g węglowodanów</span>
            </div>
          </div>

          <div
            className="meals__progress-track"
            role="progressbar"
            aria-label="Dzienne spożycie węglowodanów"
            aria-valuemin={0}
            aria-valuemax={DAILY_TARGETS.carbs}
            aria-valuenow={totals.carbs}
          >
            <div
              className="meals__progress-fill"
              style={{ width: `${carbsProgress}%` }}
            />
          </div>

          <p className="meals__progress-description">
            {totals.carbs.toLocaleString('pl-PL')} z{' '}
            {DAILY_TARGETS.carbs.toLocaleString('pl-PL')} g węglowodanów
          </p>

          <div className="meals__macro-grid">
            <div className="meals__macro-card meals__macro-card--ww">
              <span className="meals__macro-label">WW</span>
              <strong>{formatNumber(totals.ww)}</strong>
              <small>cel: {formatNumber(DAILY_TARGETS.ww)}</small>
            </div>

            <div className="meals__macro-card meals__macro-card--wbt">
              <span className="meals__macro-label">WBT</span>
              <strong>{formatNumber(totals.wbt)}</strong>
              <small>cel: {formatNumber(DAILY_TARGETS.wbt)}</small>
            </div>

            <div className="meals__macro-card meals__macro-card--energy">
              <span className="meals__macro-label">Energia</span>

              <strong>
                {totals.calories.toLocaleString('pl-PL')}
                <em> kcal</em>
              </strong>

              <small>pozostało: {remainingCarbs} g</small>
            </div>
          </div>

          <div
            className={`meals__impact meals__impact--${glycemicImpact.modifier}`}
          >
            <div className="meals__impact-heading">
              <span>Szacunkowy wpływ na glikemię</span>
              <strong>{glycemicImpact.label}</strong>
            </div>

            <p>{glycemicImpact.description}</p>
          </div>

          <p className="meals__legend">
            <span>
              <b>WW</b> — wymienniki węglowodanowe
            </span>

            <span>
              <b>WBT</b> — wymienniki białkowo-tłuszczowe
            </span>
          </p>
        </div>
      </section>

      <section className="meals__list" aria-label="Rodzaje posiłków">
        {MEAL_SECTIONS.map((meal) => {
          const savedProducts = savedMeals[meal.id];
          const isExpanded = expandedMeals.has(meal.id);
          const mealTotals = calculateMealTotals(savedProducts);

          return (
            <article className="meals__group" key={meal.id}>
              <div className="meals__row">
                <button
                  className="meals__row-main"
                  type="button"
                  onClick={() => {
                    if (savedProducts.length > 0) {
                      toggleExpanded(meal.id);
                    } else {
                      openAddProduct(meal.id);
                    }
                  }}
                >
                  <div className={`meals__icon meals__icon--${meal.tone}`}>
                    <Icon name="fork" size={22} />
                  </div>

                  <div className="meals__row-info">
                    <span className="meals__name">{meal.name}</span>

                    {savedProducts.length > 0 && (
                      <small>
                        {savedProducts.length}{' '}
                        {savedProducts.length === 1 ? 'produkt' : 'produkty'} ·{' '}
                        {mealTotals.carbs.toLocaleString('pl-PL')} g węgli ·{' '}
                        {mealTotals.calories} kcal
                      </small>
                    )}
                  </div>
                </button>

                {savedProducts.length > 0 && (
                  <button
                    className={`meals__expand-button ${
                      isExpanded ? 'meals__expand-button--open' : ''
                    }`}
                    type="button"
                    onClick={() => toggleExpanded(meal.id)}
                    aria-label={
                      isExpanded
                        ? `Zwiń listę: ${meal.name}`
                        : `Rozwiń listę: ${meal.name}`
                    }
                  >
                    ⌄
                  </button>
                )}

                <button
                  className="meals__add-button"
                  type="button"
                  aria-label={`Dodaj produkt do posiłku: ${meal.name}`}
                  onClick={() => openAddProduct(meal.id)}
                >
                  <Icon name="plus" size={22} />
                </button>
              </div>

              {isExpanded && savedProducts.length > 0 && (
                <div className="meals__saved-list">
                  {savedProducts.map((product) => (
                    <div
                      className="meals__saved-product"
                      key={product.entryId}
                    >
                      <div>
                        <strong>{product.name}</strong>

                        <small>
                          {product.portion} · {product.calories} kcal ·{' '}
                          {formatNumber(product.ww)} WW ·{' '}
                          {formatNumber(product.wbt)} WBT
                        </small>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeProduct(meal.id, product.entryId)
                        }
                        aria-label={`Usuń produkt: ${product.name}`}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  ))}

                  <button
                    className="meals__bolus-button"
                    type="button"
                    onClick={() =>
                      handleCalculateBolus(
                        meal.id,
                        meal.name,
                        savedProducts,
                      )
                    }
                  >
                    Oblicz bolus dla tego posiłku
                    <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </section>
  );
}