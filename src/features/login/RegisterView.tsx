import { useState, type FormEvent } from 'react';
import { Button, Icon, Input } from '../../components';
import { firebaseRegister } from '../../lib/auth';
import type { User } from '../../mocks';
import './LoginView.css';

type Props = {
  onRegistered: (user: User) => void;
  onGoToLogin: () => void;
};

export function RegisterView({ onRegistered, onGoToLogin }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [pending, setPending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Hasła nie są identyczne.');
      return;
    }
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const user = await firebaseRegister(email, password);
      onRegistered(user);
    } catch (err) {
      setError(mapFirebaseError(err));
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
        <h2 className="login__title">Rejestracja</h2>

        <form onSubmit={handleSubmit} className="login__form" noValidate>
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
          <Input
            label="Hasło"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 6 znaków"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null); }}
            togglePassword
            invalid={!!error}
            required
          />
          <Input
            label="Potwierdź hasło"
            type="password"
            autoComplete="new-password"
            placeholder="Powtórz hasło"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(null); }}
            togglePassword
            invalid={!!error}
            required
          />
          {error && <p className="login__error">{error}</p>}

          <Button type="submit" fullWidth disabled={pending}>
            {pending ? 'Rejestracja…' : 'Zarejestruj się'}
          </Button>
        </form>

        <p className="login__register">
          Masz już konto?{' '}
          <button type="button" className="login__link login__link--accent" onClick={onGoToLogin}>
            Zaloguj się
          </button>
        </p>
      </section>
    </div>
  );
}

function mapFirebaseError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: string }).code) {
      case 'auth/email-already-in-use':
        return 'Ten adres e-mail jest już zajęty.';
      case 'auth/invalid-email':
        return 'Nieprawidłowy format adresu e-mail.';
      case 'auth/weak-password':
        return 'Hasło jest za słabe. Użyj co najmniej 6 znaków.';
      default:
        break;
    }
  }
  return err instanceof Error ? err.message : 'Coś poszło nie tak.';
}
