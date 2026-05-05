import { Card, Icon, type IconName } from '../../components';

type Props = {
  icon: IconName;
  title: string;
  description?: string;
};

/**
 * Lekki widok-zaślepka dla zakładek, które nie są jeszcze zaimplementowane.
 * Trzyma stylistykę dashboardu, dzięki czemu shell wygląda spójnie.
 */
export function PlaceholderView({ icon, title, description }: Props) {
  return (
    <div style={{ padding: 'var(--sp-5)', paddingBottom: 'calc(72px + var(--sp-6))' }}>
      <Card padded>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--sp-3)',
          padding: 'var(--sp-6) var(--sp-3)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-primary-50)', color: 'var(--color-primary-500)',
          }}>
            <Icon name={icon} size={28} />
          </div>
          <h2>{title}</h2>
          {description && <p style={{ color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </Card>
    </div>
  );
}
