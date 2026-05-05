import { useEffect, useState } from 'react';
import { Card, Icon } from '../../../components';
import { api, type GlycemiaSnapshot } from '../../../mocks';
import type { TileDefinition } from './types';
import './GlycemiaHeroTile.css';

function trendArrow(t: GlycemiaSnapshot['trend']): string {
  if (t === 'up')   return '↗';
  if (t === 'down') return '↘';
  return '→';
}

function GlycemiaHero() {
  const [snap, setSnap] = useState<GlycemiaSnapshot | null>(null);

  useEffect(() => {
    let alive = true;
    api.getCurrentGlycemia().then(s => alive && setSnap(s));
    return () => { alive = false; };
  }, []);

  // Zielona karta gdy w zakresie, primarna gdy poza zakresem.
  const tone = snap?.inRange === false ? 'primary' : 'tertiary';
  const status = snap?.inRange ? 'W zakresie docelowym' : 'Poza zakresem docelowym';

  return (
    <Card tone={tone} title="Aktualna glikemia">
      <div className="glycemiaHero">
        <div className="glycemiaHero__valueRow">
          <span className="glycemiaHero__value">
            {snap ? snap.value : '—'}
          </span>
          <div className="glycemiaHero__unitCol">
            <span className="glycemiaHero__unit">mg/dL</span>
            <span className="glycemiaHero__trend" aria-label="trend">
              {snap ? trendArrow(snap.trend) : ''}
            </span>
          </div>
        </div>
        <p className="glycemiaHero__status">{status}</p>
        <div className="glycemiaHero__sensor">
          <Icon name="signal" size={16} />
          <span>Status sensora: {snap?.sensorOnline ? 'online' : 'offline'}</span>
        </div>
      </div>
    </Card>
  );
}

export const glycemiaHeroTile: TileDefinition = {
  id: 'glycemia-hero',
  span: 12,
  priority: 10,
  Component: GlycemiaHero,
};
