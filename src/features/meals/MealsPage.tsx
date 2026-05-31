import { Icon } from '../../components';
import './MealsPage.css';

type MealItem = {
  id: number;
  name: string;
  tone: 'teal' | 'orange' | 'blue' | 'green' | 'pink' | 'cyan';
};

const meals: MealItem[] = [
  { id: 1, name: 'Śniadanie', tone: 'teal' },
  { id: 2, name: 'II Śniadanie', tone: 'orange' },
  { id: 3, name: 'Lunch', tone: 'blue' },
  { id: 4, name: 'Obiad', tone: 'green' },
  { id: 5, name: 'Przekąska', tone: 'pink' },
  { id: 6, name: 'Kolacja', tone: 'cyan' },
];

export default function MealsPage() {
  return (
    <section className="meals">
      <header className="meals__heading">
        <h1>Posiłki</h1>
      </header>

      <section className="meals__summary">
        <p className="meals__section-label">Podsumowanie dnia</p>

        <div className="meals__balance-card">
          <h2>Dzisiejszy bilans</h2>
          <p className="meals__calories">1 420 kcal</p>
          <p className="meals__date">Środa, 24 maja</p>

          <div
            className="meals__progress-track"
            role="progressbar"
            aria-label="Dzisiejszy bilans kalorii"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={68}
          >
            <div className="meals__progress-fill" />
          </div>

          <div className="meals__macro-grid">
            <div className="meals__macro-card meals__macro-card--ww">
              <span>WW</span>
              <strong>12.4</strong>
              <small>cel: 18.0</small>
            </div>

            <div className="meals__macro-card meals__macro-card--wbt">
              <span>WBT</span>
              <strong>8.2</strong>
              <small>cel: 12.0</small>
            </div>

            <div className="meals__macro-card meals__macro-card--carbs">
              <span>Węgle</span>
              <strong>145 g</strong>
              <small>pozostało: 45 g</small>
            </div>
          </div>
        </div>
      </section>

      <section className="meals__list" aria-label="Rodzaje posiłków">
        {meals.map((meal) => (
          <article className="meals__row" key={meal.id}>
            <div className={`meals__icon meals__icon--${meal.tone}`}>
              <Icon name="fork" size={22} />
            </div>

            <span className="meals__name">{meal.name}</span>

            <button
              className="meals__add-button"
              type="button"
              aria-label={`Dodaj posiłek: ${meal.name}`}
              onClick={() => console.info(`Dodawanie posiłku: ${meal.name}`)}
            >
              <Icon name="plus" size={22} />
            </button>
          </article>
        ))}
      </section>
    </section>
  );
}