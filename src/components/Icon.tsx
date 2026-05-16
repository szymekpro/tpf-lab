import type { SVGProps } from 'react';

/**
 * Pojedynczy rejestr ikon (inline SVG) – żaden zewnętrzny pakiet.
 * Dodawanie nowej ikony = dopisanie wpisu do `paths` (jeden klucz, jeden `<path>`).
 */
const paths = {
  shield:    'M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Zm-1 9H8l4-7v5h3l-4 7v-5Z',
  eye:       'M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  eyeOff:    'M2.1 3.5 3.5 2.1l18.4 18.4-1.4 1.4-3-3A12.4 12.4 0 0 1 12 19c-7 0-10-7-10-7a17.9 17.9 0 0 1 4.6-5.5L2.1 3.5ZM12 7a5 5 0 0 1 5 5c0 .7-.1 1.3-.4 1.9l-2.2-2.2a3 3 0 0 0-2.1-2.1l-2.2-2.2c.6-.3 1.2-.4 1.9-.4Z',
  arrowRight:'M5 12h12m0 0-4-4m4 4-4 4',
  trend:     'M4 18 10 12 14 16 20 8',
  signal:    'M4 12a8 8 0 0 1 16 0M7 12a5 5 0 0 1 10 0M10 12a2 2 0 0 1 4 0',
  home:      'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z',
  drop:      'M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z',
  fork:      'M6 3v8a4 4 0 0 0 8 0V3M10 14v6M6 21h8',
  syringe:   'M14 3l7 7-2 2-2-2-2 2 2 2-2 2-2-2-2 2 2 2-2 2-2-2-2 2-3-3 2-2-2-2 7-7Z',
  user:      'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  plus:      'M12 5v14M5 12h14',
  bell:      'M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3V8Zm4 11a2 2 0 0 0 4 0',
  search:    'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm10 17-5.2-5.2',
  settings:  'M4 7h16M10 7v4M4 17h16M14 17v-4',
  edit:      'M4 20h4l10-10-4-4L4 16v4Zm9-11 4 4',
  logout:    'M5 4h8a2 2 0 0 1 2 2v4M13 14v4a2 2 0 0 1-2 2H5M21 12h-9M16 8l-4 4 4 4',
  bluetooth: 'M6.5 6.5 17.5 17.5M17.5 6.5 7 17l5 5V2l-5 5 10.5 10.5',
  key:       'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
  database:  'M12 3c4.4 0 8 1.1 8 2.5v13c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5v-13C4 4.1 7.6 3 12 3zm8 6.5c0 1.4-3.6 2.5-8 2.5S4 10.9 4 9.5m16 4c0 1.4-3.6 2.5-8 2.5S4 14.9 4 13.5',
  trash:     'M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2',
  shieldCheck: 'M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3zm-1.5 8.5 2 2 4-4',
} as const;

export type IconName = keyof typeof paths;

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
  /** Niektóre ikony to outline – użyj `stroke` zamiast `fill`. */
  variant?: 'fill' | 'stroke';
};

const STROKE_ICONS: ReadonlySet<IconName> = new Set([
  'arrowRight', 'trend', 'signal', 'fork', 'plus', 'bell', 'search',
  'settings', 'edit', 'logout', 'bluetooth', 'key', 'database', 'trash', 'shieldCheck',
]);

export function Icon({ name, size = 20, variant, ...rest }: Props) {
  const useStroke = variant ? variant === 'stroke' : STROKE_ICONS.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d={paths[name]}
        fill={useStroke ? 'none' : 'currentColor'}
        stroke={useStroke ? 'currentColor' : 'none'}
        strokeWidth={useStroke ? 2 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
