import type { TileDefinition } from './types';
import { glycemiaHeroTile } from './GlycemiaHeroTile';
import { gmiTile, iobTile, tirTile } from './StatTile';
import { glycemiaChartTile } from './GlycemiaChartTile';

/**
 * Rejestr kafelków dashboardu – ŹRÓDŁO PRAWDY dla zawartości widoku.
 * Aby dodać nowy kafelek:
 *   1. Stwórz plik `XYZTile.tsx` eksportujący `TileDefinition`.
 *   2. Dopisz go do tablicy poniżej.
 * Kolejność określa `priority` (mniejsze = wyżej), nie pozycja w tablicy.
 */
export const DASHBOARD_TILES: ReadonlyArray<TileDefinition> = [
  glycemiaHeroTile,
  tirTile,
  gmiTile,
  iobTile,
  glycemiaChartTile,
];

/** Pomocnik – zwraca posortowane definicje. */
export function getOrderedTiles(): TileDefinition[] {
  return [...DASHBOARD_TILES].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
  );
}
