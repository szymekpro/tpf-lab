import type { ComponentType } from 'react';
import type { User } from '../../../mocks';

export type DetailRoute = 'sensor';

/**
 * Kontekst, który DashboardView przekazuje do każdego kafelka.
 * Dodawanie nowych pól tutaj nie wymaga zmian w istniejących kafelkach
 * – konsumenci po prostu wybierają z propsa to, czego potrzebują.
 */
export type TileContext = {
  user: User;
  onNavigate?: (route: DetailRoute) => void;
};

/**
 * Definicja kafelka – wpis rejestru.
 *  - `id`     – unikalny klucz, używany jako React key + do persystencji ustawień.
 *  - `span`   – ile kolumn (z 12) zajmuje na siatce dashboardu.
 *  - `priority` – kolejność (mniejsze = wyżej). Domyślnie 100.
 *  - `Component` – właściwy widok kafelka.
 */
export type TileDefinition = {
  id: string;
  span: 4 | 6 | 8 | 12;
  priority?: number;
  Component: ComponentType<TileContext>;
};
