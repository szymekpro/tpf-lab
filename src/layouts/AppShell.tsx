import type { ReactNode } from 'react';
import { Icon, type IconName } from '../components';
import './AppShell.css';

export type AppRoute = 'home' | 'glycemia' | 'meals' | 'insulin' | 'account';

type NavItem = { id: AppRoute; label: string; icon: IconName };

const NAV: ReadonlyArray<NavItem> = [
  { id: 'home',     label: 'Główny',    icon: 'home' },
  { id: 'glycemia', label: 'Glikemia',  icon: 'drop' },
  { id: 'meals',    label: 'Posiłki',   icon: 'fork' },
  { id: 'insulin',  label: 'Insulina',  icon: 'syringe' },
  { id: 'account',  label: 'Konto',     icon: 'user' },
];

type Props = {
  active: AppRoute;
  onChange: (r: AppRoute) => void;
  children: ReactNode;
};

export function AppShell({ active, onChange, children }: Props) {
  return (
    <div className="shell">
      <header className="shell__top">
        <span className="shell__brand">DiabetCare</span>
      </header>

      <main className="shell__content">{children}</main>

      <nav className="shell__nav" aria-label="Nawigacja główna">
        {NAV.map(item => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              className={`shell__navItem ${isActive ? 'shell__navItem--active' : ''}`}
              onClick={() => onChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
