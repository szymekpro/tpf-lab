import { useState, type FormEvent } from 'react';
import { Button, Icon, Input, type IconName } from '../../components';
import { firebaseChangePassword, firebaseDeleteAccount } from '../../lib/auth';
import './PrivacyView.css';

type Props = {
  onBack: () => void;
  onAccountDeleted?: () => void;
};

type OptionItem = {
  icon: IconName;
  title: string;
  subtitle: string;
  subtitleAccent?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

const OPTIONS: OptionItem[] = [
  {
    icon: 'shieldCheck',
    title: 'Dwuetapowa weryfikacja',
    subtitle: 'Włączone',
    subtitleAccent: true,
  },
  {
    icon: 'user',
    title: 'Uprawnienia aplikacji',
    subtitle: 'Lokalizacja, Aparat, Bluetooth',
  },
  {
    icon: 'database',
    title: 'Zarządzanie danymi',
    subtitle: 'Eksportuj lub usuń historię glikemii',
  },
];

export function PrivacyView({ onBack, onAccountDeleted }: Props) {
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Nowe hasła nie są identyczne.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('Nowe hasło musi różnić się od aktualnego.');
      return;
    }

    setPasswordPending(true);
    try {
      await firebaseChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Hasło zostało zmienione.');
    } catch (err) {
      setPasswordError(mapAccountActionError(err));
    } finally {
      setPasswordPending(false);
    }
  }

  async function handleDeleteSubmit(e: FormEvent) {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Podaj aktualne hasło, aby usunąć konto.');
      return;
    }

    setDeletePending(true);
    try {
      await firebaseDeleteAccount(deletePassword);
      onAccountDeleted?.();
    } catch (err) {
      setDeleteError(mapAccountActionError(err));
      setDeletePending(false);
    }
  }

  function resetDeleteConfirm() {
    setDeleteConfirm(false);
    setDeletePassword('');
    setDeleteError(null);
  }

  return (
    <div className="privacyView">

      <header className="privacyView__header">
        <button type="button" className="privacyView__back" onClick={onBack} aria-label="Wróć">
          <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="privacyView__title">Prywatność i bezpieczeństwo</h1>
      </header>

      <div className="privacyView__body">

        <div className="privacyHero" aria-hidden="true">
          <div className="privacyHero__gradient" />
          <div className="privacyHero__iconWrap">
            <Icon name="shield" size={56} />
          </div>
          <p className="privacyHero__label">Twoje dane są chronione</p>
        </div>

        <ul className="privacyList">
          <li>
            <button
              type="button"
              className="privacyList__item"
              onClick={() => {
                setPasswordExpanded(open => !open);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              aria-expanded={passwordExpanded}
            >
              <div className="privacyList__iconBox">
                <Icon name="key" size={20} />
              </div>
              <div className="privacyList__text">
                <span className="privacyList__title">Zmień hasło</span>
                <span className="privacyList__subtitle">Wymaga aktualnego hasła</span>
              </div>
              <Icon
                name="arrowRight"
                size={16}
                className={`privacyList__chevron ${passwordExpanded ? 'privacyList__chevron--open' : ''}`}
              />
            </button>

            {passwordExpanded && (
              <form className="privacySecurityForm" onSubmit={handlePasswordSubmit} noValidate>
                <Input
                  label="Aktualne hasło"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={e => {
                    setCurrentPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  togglePassword
                  invalid={!!passwordError}
                  required
                />
                <Input
                  label="Nowe hasło"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 znaków"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  togglePassword
                  invalid={!!passwordError}
                  required
                />
                <Input
                  label="Powtórz nowe hasło"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  togglePassword
                  invalid={!!passwordError}
                  required
                />

                {passwordError && <p className="privacySecurityForm__error">{passwordError}</p>}
                {passwordSuccess && <p className="privacySecurityForm__success">{passwordSuccess}</p>}

                <Button type="submit" fullWidth disabled={passwordPending}>
                  {passwordPending ? 'Zapisywanie…' : 'Zapisz nowe hasło'}
                </Button>
              </form>
            )}
          </li>

          {OPTIONS.map((opt) => (
            <li key={opt.title}>
              <button
                type="button"
                className="privacyList__item"
                onClick={opt.onPress ?? (() => {})}
              >
                <div className="privacyList__iconBox">
                  <Icon name={opt.icon} size={20} />
                </div>
                <div className="privacyList__text">
                  <span className="privacyList__title">{opt.title}</span>
                  <span className={`privacyList__subtitle ${opt.subtitleAccent ? 'privacyList__subtitle--accent' : ''}`}>
                    {opt.subtitle}
                  </span>
                </div>
                <Icon name="arrowRight" size={16} className="privacyList__chevron" />
              </button>
            </li>
          ))}
        </ul>

        {!deleteConfirm ? (
          <button
            type="button"
            className="privacyDelete"
            onClick={() => setDeleteConfirm(true)}
          >
            <div className="privacyDelete__iconBox">
              <Icon name="trash" size={18} />
            </div>
            <div className="privacyList__text">
              <span className="privacyDelete__title">Usuń konto</span>
              <span className="privacyDelete__subtitle">Ta akcja jest nieodwracalna</span>
            </div>
            <Icon name="arrowRight" size={16} className="privacyList__chevron privacyDelete__chevron" />
          </button>
        ) : (
          <form className="privacyDelete privacyDelete--confirm" onSubmit={handleDeleteSubmit} noValidate>
            <p className="privacyDelete__confirmText">
              Usunięcie konta jest nieodwracalne. Podaj aktualne hasło, aby potwierdzić operację.
            </p>
            <Input
              label="Aktualne hasło"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={e => {
                setDeletePassword(e.target.value);
                setDeleteError(null);
              }}
              togglePassword
              invalid={!!deleteError}
              required
            />
            {deleteError && <p className="privacyDelete__error">{deleteError}</p>}
            <div className="privacyDelete__confirmActions">
              <button type="button" className="privacyDelete__cancel" onClick={resetDeleteConfirm} disabled={deletePending}>
                Anuluj
              </button>
              <button type="submit" className="privacyDelete__confirm" disabled={deletePending}>
                {deletePending ? 'Usuwanie…' : 'Usuń konto'}
              </button>
            </div>
          </form>
        )}

        <p className="privacyHint">
          Aby dowiedzieć się więcej o tym, jak przetwarzamy Twoje dane, przeczytaj naszą{' '}
          <button type="button" className="privacyHint__link">Politykę Prywatności</button>.
        </p>

      </div>
    </div>
  );
}

function mapAccountActionError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: string }).code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Aktualne hasło jest nieprawidłowe.';
      case 'auth/weak-password':
        return 'Nowe hasło jest za słabe. Użyj co najmniej 6 znaków.';
      case 'auth/requires-recent-login':
        return 'Ta operacja wymaga ponownego logowania. Wyloguj się i zaloguj ponownie.';
      case 'auth/too-many-requests':
        return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
      default:
        break;
    }
  }

  return err instanceof Error ? err.message : 'Coś poszło nie tak. Spróbuj ponownie.';
}
