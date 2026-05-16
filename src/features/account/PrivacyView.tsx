import { useState } from 'react';
import { Icon, type IconName } from '../../components';
import './PrivacyView.css';

type Props = {
  onBack: () => void;
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
    icon: 'key',
    title: 'Zmień hasło',
    subtitle: 'Ostatnia zmiana: 3 miesiące temu',
  },
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

export function PrivacyView({ onBack }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="privacyView">

      {/* Header */}
      <header className="privacyView__header">
        <button type="button" className="privacyView__back" onClick={onBack} aria-label="Wróć">
          <Icon name="arrowRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="privacyView__title">Prywatność i bezpieczeństwo</h1>
      </header>

      <div className="privacyView__body">

        {/* Hero */}
        <div className="privacyHero" aria-hidden="true">
          <div className="privacyHero__gradient" />
          <div className="privacyHero__iconWrap">
            <Icon name="shield" size={56} />
          </div>
          <p className="privacyHero__label">Twoje dane są chronione</p>
        </div>

        {/* Lista opcji */}
        <ul className="privacyList">
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

        {/* Usuń konto */}
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
          <div className="privacyDelete privacyDelete--confirm">
            <p className="privacyDelete__confirmText">
              Czy na pewno chcesz usunąć konto? Wszystkie dane zostaną trwale usunięte.
            </p>
            <div className="privacyDelete__confirmActions">
              <button type="button" className="privacyDelete__cancel" onClick={() => setDeleteConfirm(false)}>
                Anuluj
              </button>
              <button type="button" className="privacyDelete__confirm">
                Usuń konto
              </button>
            </div>
          </div>
        )}

        {/* Privacy hint */}
        <p className="privacyHint">
          Aby dowiedzieć się więcej o tym, jak przetwarzamy Twoje dane, przeczytaj naszą{' '}
          <button type="button" className="privacyHint__link">Politykę Prywatności</button>.
        </p>

      </div>
    </div>
  );
}
