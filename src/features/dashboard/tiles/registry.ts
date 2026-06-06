import type { TileDefinition } from './types';
import { glycemiaHeroTile } from './GlycemiaHeroTile';
import { gmiTile, iobTile, tirTile } from './StatTile';
import { glycemiaChartTile } from './GlycemiaChartTile';

export const DASHBOARD_TILES: ReadonlyArray<TileDefinition> = [
  glycemiaHeroTile,
  glycemiaChartTile,
  tirTile,
  gmiTile,
  iobTile,
];

export function getOrderedTiles(): TileDefinition[] {
  return [...DASHBOARD_TILES].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
  );
}
