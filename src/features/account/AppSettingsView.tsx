import { useState } from 'react';
import { Icon, type IconName } from '../../components';
import { useTheme } from '../../contexts/theme';
import './AppSettingsView.css';

type Props = {
  onBack: () => void;
};

type SettingsRowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  action?: 'chevron' | 'switch';
  checked?: boolean;
  onClick?: () => void;
};

const LANGUAGES = [
  { code: 'PL', label: 'Polski' },
  { code: 'EN', label: 'English' },
] as const;

const HELP_TOPICS = [
  'Połączenie sensora CGM',
  'Eksport raportu AGP',
  'Reset hasła i bezpieczeństwo',
] as const;

export function AppSettingsView({ onBack }: Props) {
  const { darkMode, setDarkMode } = useTheme();
  const [languageIndex, setLanguageIndex] = useState(0);
  const [lastSync, setLastSync] = useState('przed chwilą');
  const [helpOpen, setHelpOpen] = useState(false);

  const language = LANGUAGES[languageIndex];

  function toggleLanguage() {
    setLanguageIndex(index => (index + 1) % LANGUAGES.length);
  }

  function syncNow() {
    setLastSync('teraz');
    window.setTimeout(() => setLastSync('przed chwilą'), 1800);
  }

  return (
    <div className="appSettings">
      <header className="appSettings__header">
        <button type="button" className="appSettings__back" onClick={onBack} aria-label="Wróć">
          <Icon name="arrowRight" size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 className="appSettings__title">Ustawienia aplikacji</h1>
      </header>

      <div className="appSettings__body">
        <section className="appSettings__section">
          <h2 className="appSettings__sectionTitle">Preferencje</h2>
          <div className="appSettings__stack">
            <SettingsRow
              icon="globe"
              title="Język"
              subtitle={`${language.label} (${language.code})`}
              action="chevron"
              onClick={toggleLanguage}
            />
            <SettingsRow
              icon="moon"
              title="Tryb ciemny"
              subtitle={darkMode ? 'Włączony' : 'Dostosuj do systemu'}
              action="switch"
              checked={darkMode}
              onClick={() => setDarkMode(!darkMode)}
            />
          </div>
        </section>

        <section className="appSettings__section">
          <h2 className="appSettings__sectionTitle">System</h2>
          <div className="appSettings__stack">
            <SettingsRow
              icon="sync"
              title="Synchronizacja danych"
              subtitle={`Ostatnio: ${lastSync}`}
              action="chevron"
              onClick={syncNow}
            />
          </div>
        </section>

        <section className="appSettings__section">
          <h2 className="appSettings__sectionTitle">Informacje</h2>
          <div className="appSettings__stack">
            <SettingsRow
              icon="info"
              title="O aplikacji"
              subtitle="Wersja 2.4.0 (Build 128)"
              action="chevron"
            />
          </div>
        </section>

        <section className="appSettingsHelp">
          <h2 className="appSettingsHelp__title">Potrzebujesz pomocy?</h2>
          <p className="appSettingsHelp__copy">
            Sprawdź naszą bazę wiedzy lub skontaktuj się z zespołem wsparcia DiabetCare.
          </p>
          <button
            type="button"
            className="appSettingsHelp__button"
            onClick={() => setHelpOpen(open => !open)}
            aria-expanded={helpOpen}
          >
            {helpOpen ? 'Ukryj informacje' : 'Centrum Pomocy'}
          </button>

          {helpOpen && (
            <div className="appSettingsHelpPanel">
              <div className="appSettingsHelpPanel__block">
                <span className="appSettingsHelpPanel__label">Najczęstsze tematy</span>
                <ul className="appSettingsHelpPanel__list">
                  {HELP_TOPICS.map(topic => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div className="appSettingsHelpPanel__grid">
                <div>
                  <span className="appSettingsHelpPanel__label">Kontakt</span>
                  <strong>support@diabetcare.pl</strong>
                  <span>pn-pt, 8:00-18:00</span>
                </div>
                <div>
                  <span className="appSettingsHelpPanel__label">Status</span>
                  <strong>Online</strong>
                  <span>średnia odpowiedź: 2 h</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SettingsRow({ icon, title, subtitle, action, checked, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      className="appSettingsRow"
      onClick={onClick}
      aria-label={title}
    >
      <span className="appSettingsRow__icon">
        <Icon name={icon} size={22} />
      </span>
      <span className="appSettingsRow__text">
        <span className="appSettingsRow__title">{title}</span>
        <span className="appSettingsRow__subtitle">{subtitle}</span>
      </span>
      {action === 'chevron' && (
        <Icon name="arrowRight" size={18} className="appSettingsRow__chevron" />
      )}
      {action === 'switch' && (
        <span
          role="switch"
          aria-checked={checked}
          className={`appSettingsSwitch ${checked ? 'appSettingsSwitch--on' : ''}`}
        >
          <span className="appSettingsSwitch__knob" />
        </span>
      )}
    </button>
  );
}
