import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  iconLeft,
  iconRight,
  className = '',
  children,
  ...rest
}: Props) {
  const cls = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} {...rest}>
      {iconLeft && <span className="btn__icon">{iconLeft}</span>}
      {children && <span className="btn__label">{children}</span>}
      {iconRight && <span className="btn__icon">{iconRight}</span>}
    </button>
  );
}
