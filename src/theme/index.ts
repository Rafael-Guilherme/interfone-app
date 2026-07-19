/**
 * Design tokens — derivados do wireframe (README).
 * O accent #FF0000 foi confirmado pelo cliente como a cor de marca (2026-07-19).
 */

export const colors = {
  // Marca
  accent: '#FF0000',
  accentPressed: '#D40000',

  // Texto
  text: '#14161C',
  textStrong: '#23232A',
  textSecondary: '#8A8F9C',
  textMuted: '#8A8A93',
  textOnAccent: '#FFFFFF',

  // Superfícies
  bg: '#F7F8FB',
  card: '#FFFFFF',
  // Superfícies escuras (telas de chamada / sidebars)
  dark: '#0E1116',
  darkAlt: '#13161C',
  textOnDark: '#FFFFFF',

  // Status
  success: '#1FBF75',
  successBg: '#E6F8EF',
  warning: '#B9791A',
  warningBg: '#FEF7EC',
  error: '#E5484D',
  errorBg: '#FFECEC',

  border: '#E4E6EB',
} as const;

export const radii = {
  card: 14,
  button: 13,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  family: 'Inter',
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const theme = { colors, radii, spacing, typography } as const;
export type Theme = typeof theme;
