import "./MealsPage.css";

type MealItem = {
  id: number;
  name: string;
  icon: string;
  iconClass: string;
};

const meals: MealItem[] = [
  {
    id: 1,
    name: "Śniadanie",
    icon: "🥐",
    iconClass: "meal-icon breakfast",
  },
  {
    id: 2,
    name: "II Śniadanie",
    icon: "i05",
    iconClass: "meal-icon second-breakfast",
  },
  {
    id: 3,
    name: "Lunch",
    icon: "🍴",
    iconClass: "meal-icon lunch",
  },
  {
    id: 4,
    name: "Obiad",
    icon: "🍜",
    iconClass: "meal-icon dinner",
  },
  {
    id: 5,
    name: "Przekąska",
    icon: "🍦",
    iconClass: "meal-icon snack",
  },
  {
    id: 6,
    name: "Kolacja",
    icon: "🍽️",
    iconClass: "meal-icon supper",
  },
];

export default function MealsPage() {
  return (
    <main className="meals-page">
      <header className="meals-topbar">
        <span className="meals-logo">DiabetCare</span>
      </header>

      <section className="meals-content">
        <h1>Posiłki</h1>

        <section className="daily-summary-card">
          <p className="section-label">PODSUMOWANIE DNIA</p>

          <div className="balance-card">
            <h2>Dzisiejszy bilans</h2>
            <p className="calories">1 420 kcal</p>
            <p className="date">Środa, 24 maja</p>

            <div className="progress-track">
              <div className="progress-fill" />
            </div>

            <div className="macro-grid">
              <div className="macro-card protein">
                <span>WW</span>
                <strong>12.4</strong>
                <small>cel: 18.0</small>
              </div>

              <div className="macro-card fat">
                <span>WBT</span>
                <strong>8.2</strong>
                <small>cel: 12.0</small>
              </div>

              <div className="macro-card carbs">
                <span>WĘGLE</span>
                <strong>145g</strong>
                <small>pozostało: 45g</small>
              </div>
            </div>
          </div>
        </section>

        <section className="meal-list">
          {meals.map((meal) => (
            <article className="meal-row" key={meal.id}>
              <div className={meal.iconClass}>
                <span>{meal.icon}</span>
              </div>

              <span className="meal-name">{meal.name}</span>

              <button
                className="add-meal-button"
                type="button"
                aria-label={`Dodaj posiłek: ${meal.name}`}
                onClick={() => console.log(`Dodawanie posiłku: ${meal.name}`)}
              >
                +
              </button>
            </article>
          ))}
        </section>
      </section>

      <nav className="bottom-navigation">
        <button type="button" className="nav-item">
          <span>⌂</span>
          <small>PANEL GŁÓWNY</small>
        </button>

        <button type="button" className="nav-item">
          <span>♒</span>
          <small>GLIKEMIA</small>
        </button>

        <button type="button" className="nav-item active">
          <span>🍴</span>
          <small>POSIŁKI</small>
        </button>

        <button type="button" className="nav-item">
          <span>▣</span>
          <small>INSULINA</small>
        </button>

        <button type="button" className="nav-item">
          <span>♙</span>
          <small>KONTO</small>
        </button>
      </nav>
    </main>
  );
}