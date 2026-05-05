import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';
import './Input.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  error?: string;
  iconRight?: ReactNode;
  /** Dla `type="password"` automatycznie pokazuje przełącznik widoczności hasła. */
  togglePassword?: boolean;
};

export function Input({
  label,
  error,
  iconRight,
  togglePassword,
  type = 'text',
  id,
  className = '',
  ...rest
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [show, setShow] = useState(false);
  const effectiveType = togglePassword && show ? 'text' : type;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="field__label">{label}</label>}
      <div className="field__control">
        <input id={inputId} type={effectiveType} className="field__input" {...rest} />
        {togglePassword && (
          <button
            type="button"
            className="field__adornment"
            onClick={() => setShow(s => !s)}
            aria-label={show ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
        {!togglePassword && iconRight && (
          <span className="field__adornment field__adornment--static">{iconRight}</span>
        )}
      </div>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
