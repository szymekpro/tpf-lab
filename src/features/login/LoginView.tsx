import { useState, type FormEvent } from 'react';
import { Button, Icon, Input } from '../../components';
import { api, type User } from '../../mocks';
import './LoginView.css';

type Props = {
  onLoggedIn: (user: User) => void;
  onGoToRegister?: () => void;
  onForgotPassword?: () => void;
};

export function LoginView({ onLoggedIn, onGoToRegister, onForgotPassword }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = await api.login(email, password);
      onLoggedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coś poszło nie tak.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login">
      <header className="login__brand">
        <div className="login__logo" aria-hidden="true">
          <Icon name="shield" size={28} />
        </div>
        <h1 className="login__brandName">DiabetCare</h1>
        <p className="login__tagline">Kliniczna przejrzystość w&nbsp;zarządzaniu cukrzycą</p>
      </header>

      <section className="login__card">
        <h2 className="login__title">Logowanie</h2>

        <form onSubmit={handleSubmit} className="login__form" noValidate>
          <Input
            label="Adres E-mail"
            type="email"
            autoComplete="email"
            placeholder="Wprowadź swój e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Hasło"
            type="password"
            autoComplete="current-password"
            placeholder="Wprowadź swoje hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
            togglePassword
            required
            error={error ?? undefined}
          />

          <div className="login__forgot">
            <button
              type="button"
              className="login__link"
              onClick={onForgotPassword}
            >
              Zapomniałem hasła
            </button>
          </div>

          <Button type="submit" fullWidth disabled={pending}>
            {pending ? 'Logowanie…' : 'Zaloguj się'}
          </Button>
        </form>

        <p className="login__register">
          Nie masz jeszcze konta?{' '}
          <button type="button" className="login__link login__link--accent" onClick={onGoToRegister}>
            Zarejestruj się
          </button>
        </p>
      </section>
    </div>
  );
}
