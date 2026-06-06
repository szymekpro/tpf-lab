import { useState, type FormEvent } from 'react';
import { Button, Icon, Input } from '../../components';
import { firebaseResetPassword } from '../../lib/auth';
import './LoginView.css';

type Props = {
  onGoToLogin: () => void;
};

export function ForgotPasswordView({ onGoToLogin }: Props) {
  const [email, setEmail]   = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await firebaseResetPassword(email);
      setSent(true);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
          setError('Nie znaleziono konta z tym adresem e-mail.');
        } else {
          setError('Coś poszło nie tak. Spróbuj ponownie.');
        }
      } else {
        setError('Coś poszło nie tak. Spróbuj ponownie.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login">
      <header className="login__brand">
        <Icon name="shield" size={48} className="login__logo" aria-hidden="true" />
        <h1 className="login__brandName">DiabetCare</h1>
        <p className="login__tagline">Kliniczna przejrzystość w&nbsp;zarządzaniu cukrzycą</p>
      </header>

      <section className="login__card">
        <h2 className="login__title">Reset hasła</h2>

        {sent ? (
          <div className="login__form">
            <p style={{ color: 'var(--color-tertiary-500)', fontWeight: 600, margin: 0 }}>
              ✓ Link do resetu hasła został wysłany na <strong>{email}</strong>. Sprawdź swoją skrzynkę mailową.
            </p>
            <Button fullWidth onClick={onGoToLogin}>
              Wróć do logowania
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login__form" noValidate>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)', margin: 0 }}>
              Podaj adres e-mail powiązany z kontem — wyślemy link do ustawienia nowego hasła.
            </p>
            <Input
              label="Adres e-mail"
              type="email"
              autoComplete="email"
              placeholder="Wprowadź swój e-mail"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              invalid={!!error}
              required
            />
            {error && <p className="login__error">{error}</p>}

            <Button type="submit" fullWidth disabled={pending}>
              {pending ? 'Wysyłanie…' : 'Wyślij link resetujący'}
            </Button>
          </form>
        )}

        {!sent && (
          <p className="login__register">
            <button type="button" className="login__link login__link--accent" onClick={onGoToLogin}>
              ← Wróć do logowania
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
