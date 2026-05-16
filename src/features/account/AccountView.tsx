import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Icon } from '../../components';
import { useUnit, convertGlycemia } from '../../contexts/UnitContext';
import { api, type AccountProfile, type User } from '../../mocks';
import './AccountView.css';

type Props = {
  user: User;
  onLogout?: () => void;
};

function formatGlucose(value: number, unit: 'mg/dL' | 'mmol/L'): string {
  return convertGlycemia(value, unit).toString();
}

function getInitials(user: User): string {
  const first = user.firstName?.[0] ?? '';
  const last = user.lastName?.[0] ?? '';
  const fallback = user.email?.[0] ?? '';
  const initials = (first + last) || first || last || fallback;
  return initials.toUpperCase();
}

export function AccountView({ user, onLogout }: Props) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const { unit, setUnit } = useUnit();

  useEffect(() => {
    let alive = true;
    api.getAccountProfile().then(p => { if (alive) setProfile(p); });
    return () => { alive = false; };
  }, []);

  const fullName = useMemo(() => {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }, [user.firstName, user.lastName]);

  const initials = useMemo(() => getInitials(user), [user]);
  const isLoaded = Boolean(profile);
  const clinical = profile?.clinical;

  const unitLabel = unit === 'mmol/L' ? 'mmol/L' : 'mg/dL';
  const isfUnit = unit === 'mmol/L' ? 'mmol/L/j' : 'mg/dL/j';

  function handleAction(label: string) {
    console.info(`Akcja: ${label}`);
  }

  return (
    <div className="account">
      <header className="account__header">
        <h1>Konto</h1>
      </header>

      <Card className="account__profile">
        <div className="account__avatar" aria-hidden="true">{initials}</div>
        <div className="account__identity">
          <span className="account__name">{fullName || '—'}</span>
          <span className="account__email">{user.email}</span>
        </div>
      </Card>

      <section className="account__section">
        <h2 className="account__sectionTitle">Parametry kliniczne</h2>
        <div className="account__grid">
          <Card className="account__statCard">
            <div className="account__statLabel">ICR</div>
            <div className="account__statValue">
              <span className="account__statMain">
                {isLoaded && clinical ? clinical.icr : '—'}
              </span>
              <span className="account__statUnit">j/WW</span>
            </div>
            <span className="account__statHint">Współczynnik węglowodanowy</span>
          </Card>

          <Card className="account__statCard">
            <div className="account__statLabel">ISF</div>
            <div className="account__statValue">
              <span className="account__statMain">
                {isLoaded && clinical ? formatGlucose(clinical.isf, unit) : '—'}
              </span>
              <span className="account__statUnit">{isfUnit}</span>
            </div>
            <span className="account__statHint">Współczynnik wrażliwości</span>
          </Card>
        </div>

        <Card
          className="account__target"
          title="Cel glikemii"
          action={(
            <button
              type="button"
              className="account__iconButton"
              onClick={() => handleAction('Edycja celu glikemii')}
              aria-label="Edytuj cel glikemii"
            >
              <Icon name="edit" size={16} />
            </button>
          )}
        >
          <div className="account__targetValue">
            {isLoaded && clinical
              ? `${formatGlucose(clinical.targetMin, unit)} – ${formatGlucose(clinical.targetMax, unit)} ${unitLabel}`
              : '—'}
          </div>
        </Card>
      </section>

      <section className="account__section">
        <h2 className="account__sectionTitle">Preferencje</h2>
        <Card className="account__list" padded={false}>
          <div className="account__row account__row--static">
            <div className="account__rowIcon">
              <Icon name="drop" size={18} />
            </div>
            <div className="account__rowText">
              <span className="account__rowTitle">Jednostka glikemii</span>
            </div>
            <div className="account__segmented" role="group" aria-label="Jednostka glikemii">
              <button
                type="button"
                className={`account__segment ${unit === 'mg/dL' ? 'account__segment--active' : ''}`}
                onClick={() => setUnit('mg/dL')}
                aria-pressed={unit === 'mg/dL'}
              >
                mg/dL
              </button>
              <button
                type="button"
                className={`account__segment ${unit === 'mmol/L' ? 'account__segment--active' : ''}`}
                onClick={() => setUnit('mmol/L')}
                aria-pressed={unit === 'mmol/L'}
              >
                mmol/L
              </button>
            </div>
          </div>

          <button
            type="button"
            className="account__row account__rowButton"
            onClick={() => handleAction('Powiadomienia i alarmy')}
          >
            <div className="account__rowIcon">
              <Icon name="bell" size={18} />
            </div>
            <div className="account__rowText">
              <span className="account__rowTitle">Powiadomienia i alarmy</span>
            </div>
            <Icon name="arrowRight" size={18} className="account__rowChevron" />
          </button>

          <button
            type="button"
            className="account__row account__rowButton"
            onClick={() => handleAction('Ustawienia aplikacji')}
          >
            <div className="account__rowIcon">
              <Icon name="settings" size={18} />
            </div>
            <div className="account__rowText">
              <span className="account__rowTitle">Ustawienia aplikacji</span>
            </div>
            <Icon name="arrowRight" size={18} className="account__rowChevron" />
          </button>

          <button
            type="button"
            className="account__row account__rowButton"
            onClick={() => handleAction('Prywatność i bezpieczeństwo')}
          >
            <div className="account__rowIcon">
              <Icon name="shield" size={18} />
            </div>
            <div className="account__rowText">
              <span className="account__rowTitle">Prywatność i bezpieczeństwo</span>
            </div>
            <Icon name="arrowRight" size={18} className="account__rowChevron" />
          </button>
        </Card>
      </section>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        className="account__logoutButton"
        iconLeft={<Icon name="logout" size={18} />}
        onClick={onLogout ?? (() => handleAction('Wyloguj się'))}
      >
        Wyloguj się
      </Button>
    </div>
  );
}
