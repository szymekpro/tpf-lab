import type { ComponentType } from 'react';
import type { User } from '../../../mocks';

export type DetailRoute = 'sensor' | 'edit-target' | 'privacy' | 'alarms';

export type TileContext = {
  user: User;
  onNavigate?: (route: DetailRoute) => void;
};

export type TileDefinition = {
  id: string;
  span: 4 | 6 | 8 | 12;
  priority?: number;
  Component: ComponentType<TileContext>;
};
