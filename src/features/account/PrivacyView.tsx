import { useState, type FormEvent } from 'react';
import { Button, Icon, Input, type IconName } from '../../components';
import { firebaseChangePassword, firebaseDeleteAccount } from '../../lib/auth';
import './PrivacyView.css';

type Props = {
  onBack: () => void;
  onAccountDeleted?: () => void;
};

type PrivacyPanel = 'two-factor' | 'permissions' | 'data';
type PermissionKey = 'notifications' | 'location' | 'camera' | 'bluetooth';
type DataToggleKey = 'cloudSync' | 'reportArchive';

const PERMISSION_ROWS: ReadonlyArray<{
  key: PermissionKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'notifications',
    title: 'Powiadomienia',
    subtitle: 'Alarmy glikemii i przypomnienia',
  },
  {
    key: 'location',
    title: 'Lokalizacja',
    subtitle: 'Miejsca pomiarów i raporty aktywności',
  },
  {
    key: 'camera',
    title: 'Aparat',
    subtitle: 'Skanowanie etykiet i kodów sensorów',
  },
  {
    key: 'bluetooth',
    title: 'Bluetooth',
    subtitle: 'Połączenie z sensorem CGM',
  },
];

const DATA_TOGGLE_ROWS: ReadonlyArray<{
  key: DataToggleKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'cloudSync',
    title: 'Synchronizacja w chmurze',
    subtitle: 'Kopia profilu i ustawień konta',
  },
  {
    key: 'reportArchive',
    title: 'Archiwum raportów',
    subtitle: 'Zachowuj wygenerowane raporty AGP',
  },
];

export function PrivacyView({ onBack, onAccountDeleted }: Props) {
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<PrivacyPanel | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    notifications: true,
    location: false,
    camera: true,
    bluetooth: true,
  });
  const [dataToggles, setDataToggles] = useState<Record<DataToggleKey, boolean>>({
    cloudSync: true,
    reportArchive: true,
  });
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const permissionSummary = `${Object.values(permissions).filter(Boolean).length}/${PERMISSION_ROWS.length} aktywne`;

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

  function togglePanel(panel: PrivacyPanel) {
    setPasswordExpanded(false);
    setExpandedPanel(current => current === panel ? null : panel);
  }

  function togglePermission(key: PermissionKey) {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleDataOption(key: DataToggleKey) {
    setDataToggles(prev => ({ ...prev, [key]: !prev[key] }));
    setDataNotice(null);
  }

  function setMockDataNotice(message: string) {
    setDataNotice(message);
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
                setExpandedPanel(null);
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

          <li>
            <ExpandablePrivacyRow
              icon="shieldCheck"
              title="Dwuetapowa weryfikacja"
              subtitle={twoFactorEnabled ? 'Włączone' : 'Wyłączone'}
              subtitleAccent={twoFactorEnabled}
              expanded={expandedPanel === 'two-factor'}
              onClick={() => togglePanel('two-factor')}
            />

            {expandedPanel === 'two-factor' && (
              <div className="privacyPanel">
                <div className="privacyPanel__summary">
                  <div>
                    <span className="privacyPanel__title">Aplikacja uwierzytelniająca</span>
                    <span className="privacyPanel__subtitle">
                      {twoFactorEnabled ? 'Aktywna od 12 maja 2026' : 'Nieaktywna'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={twoFactorEnabled}
                    aria-label="Dwuetapowa weryfikacja"
                    className={`privacySwitch ${twoFactorEnabled ? 'privacySwitch--on' : ''}`}
                    onClick={() => setTwoFactorEnabled(enabled => !enabled)}
                  >
                    <span className="privacySwitch__knob" />
                  </button>
                </div>

                <div className="privacyPanel__codes">
                  <span className="privacyPanel__codesLabel">Kody zapasowe</span>
                  <button
                    type="button"
                    className="privacyPanel__textButton"
                    onClick={() => setBackupCodesVisible(visible => !visible)}
                  >
                    {backupCodesVisible ? 'Ukryj' : 'Pokaż'}
                  </button>
                </div>
                {backupCodesVisible && (
                  <div className="privacyBackupCodes" aria-label="Kody zapasowe">
                    <code>DC-4821-7190</code>
                    <code>DC-9384-1056</code>
                    <code>DC-6047-3312</code>
                  </div>
                )}

              </div>
            )}
          </li>

          <li>
            <ExpandablePrivacyRow
              icon="user"
              title="Uprawnienia aplikacji"
              subtitle={permissionSummary}
              expanded={expandedPanel === 'permissions'}
              onClick={() => togglePanel('permissions')}
            />

            {expandedPanel === 'permissions' && (
              <div className="privacyPanel privacyPanel--list">
                {PERMISSION_ROWS.map((row) => (
                  <ToggleRow
                    key={row.key}
                    title={row.title}
                    subtitle={row.subtitle}
                    checked={permissions[row.key]}
                    onClick={() => togglePermission(row.key)}
                  />
                ))}
              </div>
            )}
          </li>

          <li>
            <ExpandablePrivacyRow
              icon="database"
              title="Zarządzanie danymi"
              subtitle="Eksport, cache i synchronizacja"
              expanded={expandedPanel === 'data'}
              onClick={() => togglePanel('data')}
            />

            {expandedPanel === 'data' && (
              <div className="privacyPanel">
                <div className="privacyDataStats">
                  <div>
                    <span className="privacyDataStats__value">24,8 MB</span>
                    <span className="privacyDataStats__label">Dane lokalne</span>
                  </div>
                  <div>
                    <span className="privacyDataStats__value">18 mies.</span>
                    <span className="privacyDataStats__label">Historia</span>
                  </div>
                </div>

                <div className="privacyPanel__toggleList">
                  {DATA_TOGGLE_ROWS.map((row) => (
                    <ToggleRow
                      key={row.key}
                      title={row.title}
                      subtitle={row.subtitle}
                      checked={dataToggles[row.key]}
                      onClick={() => toggleDataOption(row.key)}
                    />
                  ))}
                </div>

                <div className="privacyDataActions">
                  <button
                    type="button"
                    className="privacyDataActions__button"
                    onClick={() => setMockDataNotice('Eksport danych został przygotowany.')}
                  >
                    Eksportuj dane
                  </button>
                  <button
                    type="button"
                    className="privacyDataActions__button"
                    onClick={() => setMockDataNotice('Lokalny cache został wyczyszczony.')}
                  >
                    Wyczyść cache
                  </button>
                </div>

                {dataNotice && <p className="privacyPanel__success">{dataNotice}</p>}
              </div>
            )}
          </li>
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

type ExpandablePrivacyRowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  expanded: boolean;
  subtitleAccent?: boolean;
  onClick: () => void;
};

function ExpandablePrivacyRow({
  icon,
  title,
  subtitle,
  expanded,
  subtitleAccent,
  onClick,
}: ExpandablePrivacyRowProps) {
  return (
    <button
      type="button"
      className="privacyList__item"
      onClick={onClick}
      aria-expanded={expanded}
    >
      <div className="privacyList__iconBox">
        <Icon name={icon} size={20} />
      </div>
      <div className="privacyList__text">
        <span className="privacyList__title">{title}</span>
        <span className={`privacyList__subtitle ${subtitleAccent ? 'privacyList__subtitle--accent' : ''}`}>
          {subtitle}
        </span>
      </div>
      <Icon
        name="arrowRight"
        size={16}
        className={`privacyList__chevron ${expanded ? 'privacyList__chevron--open' : ''}`}
      />
    </button>
  );
}

type ToggleRowProps = {
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
};

function ToggleRow({ title, subtitle, checked, onClick }: ToggleRowProps) {
  return (
    <div className="privacyToggleRow">
      <div className="privacyToggleRow__text">
        <span className="privacyToggleRow__title">{title}</span>
        <span className="privacyToggleRow__subtitle">{subtitle}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`privacySwitch ${checked ? 'privacySwitch--on' : ''}`}
        onClick={onClick}
      >
        <span className="privacySwitch__knob" />
      </button>
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
