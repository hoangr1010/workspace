type ClayRamp = {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string;
};

/**
 * Build the 10-step clay ramp used by Univer's `theme.primary`.
 * Steps 300/500/600/700 read from --accent* in tokens.css; the rest are
 * Univer-only tween shades with no token equivalent.
 *
 * Must be called after the DOM is mounted (uses getComputedStyle).
 *
 * @returns A ramp object keyed 50–900 with hex color strings.
 */
export function readClayRamp(): ClayRamp {
  const root = getComputedStyle(document.documentElement);
  const v = (name: string): string => root.getPropertyValue(name).trim();

  return {
    50:  '#fdf3ef',
    100: '#f9e0d6',
    200: '#f3c2ad',
    300: v('--accent-light'),
    400: '#e58660',
    500: v('--accent'),
    600: v('--accent-dark'),
    700: v('--accent-dark-2'),
    800: '#7e3f28',
    900: '#5e2f1e',
  };
}
