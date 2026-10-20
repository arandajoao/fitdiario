import { TextStyle } from 'react-native';

/**
 * Digital Spark (Satoshi) MD3 tokens, com a paleta oliva aplicada no design
 * "Diario Fitness.dc.html".
 */
export const C = {
  primary10: '#1c1f10',
  primary30: '#3e4427',
  primary40: '#565d36',
  primary50: '#6f7749',
  primary70: '#a4ab7e',
  primary90: '#dde3c1',
  primary95: '#f1f4e4',

  secondary10: '#1d1f15',
  secondary40: '#5b5f4f',
  secondary90: '#e0e3d1',

  tertiary30: '#222860',
  tertiary95: '#e1e2f4',

  error10: '#2e090b',
  error40: '#963137',
  error90: '#ecb6b7',

  neutral0: '#000000',
  neutral10: '#212023',
  neutral100: '#ffffff',

  primary: '#565d36',
  onPrimary: '#ffffff',
  primaryContainer: '#dde3c1',
  onPrimaryContainer: '#1c1f10',
  secondaryContainer: '#e0e3d1',
  onSecondaryContainer: '#1d1f15',
  error: '#963137',
  onError: '#ffffff',
  errorContainer: '#ecb6b7',
  onErrorContainer: '#2e090b',

  surface: '#fbfbf5',
  surfaceContainerLow: '#f4f5ec',
  surfaceContainer: '#eff0e6',
  surfaceContainerHigh: '#e9eae0',
  surfaceContainerHighest: '#e3e4da',
  onSurface: '#212023',
  onSurfaceVariant: '#46493b',
  outline: '#75786a',
  outlineVariant: '#c6c9b8',
  inverseSurface: '#403e44',
  inverseOnSurface: '#f1f0f1',

  // Sequência (chama) — convertidos de oklch do design
  flameBg: '#ffe9cb',
  flameFg: '#832e00',
  flame: '#f37513',
  flameDim: '#deac83',
};

export const F = {
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
};

const t = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
});

export const T = {
  displaySmall: t(F.medium, 36, 44),
  headlineMedium: t(F.medium, 28, 36),
  headlineSmall: t(F.regular, 24, 32),
  headlineSmallStrong: t(F.medium, 24, 32),
  titleLarge: t(F.medium, 22, 28),
  titleMedium: t(F.medium, 16, 24),
  titleSmall: t(F.medium, 14, 20),
  bodyLarge: t(F.regular, 16, 24),
  bodyMedium: t(F.regular, 14, 20),
  bodySmall: t(F.regular, 12, 16),
  labelLarge: t(F.medium, 14, 20),
  labelMedium: t(F.medium, 12, 16),
  labelSmall: t(F.medium, 11, 16),
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof T;

export const R = { xs: 4, sm: 8, md: 12, lg: 16, xl: 28, full: 999 };
