import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

export type CardTone = 'surface' | 'primary' | 'tertiary' | 'inverted' | 'muted';

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone;
  padded?: boolean;
  /** Slot na treść lewej strony nagłówka karty */
  title?: ReactNode;
  /** Slot na akcje po prawej stronie nagłówka */
  action?: ReactNode;
};

export function Card({
  tone = 'surface',
  padded = true,
  title,
  action,
  className = '',
  children,
  ...rest
}: Props) {
  const cls = [
    'card',
    `card--${tone}`,
    padded ? 'card--padded' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} {...rest}>
      {(title || action) && (
        <div className="card__header">
          <div className="card__title">{title}</div>
          {action && <div className="card__action">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
