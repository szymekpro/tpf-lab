import { useEffect, useState } from 'react';
import { Card } from '../../../components';
import { api, type DashboardStats } from '../../../mocks';
import type { TileDefinition } from './types';
import './StatTile.css';

type StatKey = keyof DashboardStats;

type StatConfig = {
  id: string;
  metric: StatKey;
  label: string;
  format: (n: number) => string;
};

/**
 * Helper – tworzy gotową definicję kafelka dla pojedynczej metryki ze statystyk.
 * Dzięki temu dodanie nowego "small stat" = jedno wywołanie helpera.
 */
function makeStatTile(cfg: StatConfig): TileDefinition {
  function StatTileImpl() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    useEffect(() => {
      let alive = true;
      api.getDashboardStats().then(s => alive && setStats(s));
      return () => { alive = false; };
    }, []);

    return (
      <Card padded>
        <div className="stat">
          <span className="stat__label">{cfg.label}</span>
          <span className="stat__value">
            {stats ? cfg.format(stats[cfg.metric]) : '—'}
          </span>
        </div>
      </Card>
    );
  }

  return {
    id: cfg.id,
    span: 4,
    priority: 20,
    Component: StatTileImpl,
  };
}

export const tirTile = makeStatTile({
  id: 'stat-tir',
  metric: 'tir',
  label: 'TIR',
  format: n => `${n}%`,
});

export const gmiTile = makeStatTile({
  id: 'stat-gmi',
  metric: 'gmi',
  label: 'GMI',
  format: n => `${n}%`,
});

export const iobTile = makeStatTile({
  id: 'stat-iob',
  metric: 'iob',
  label: 'IOB',
  format: n => `${n}j`,
});
