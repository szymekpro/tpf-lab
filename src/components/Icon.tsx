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
