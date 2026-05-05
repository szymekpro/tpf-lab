import { getOrderedTiles, type TileContext } from './tiles';
import './DashboardView.css';

type Props = {
  ctx: TileContext;
};

export function DashboardView({ ctx }: Props) {
  const tiles = getOrderedTiles();

  return (
    <div className="dashboard">
      <header className="dashboard__greeting">
        <h1>Cześć, {ctx.user.firstName}</h1>
        <p>Oto twoje dzisiejsze podsumowanie</p>
      </header>

      <div className="dashboard__grid">
        {tiles.map(({ id, span, Component }) => (
          <div key={id} className={`dashboard__cell dashboard__cell--span-${span}`}>
            <Component {...ctx} />
          </div>
        ))}
      </div>
    </div>
  );
}
