const colors = {
  // ─── Primarios ─────────────────────────────────────────────────────────────
  primary: '#8B6000',
  primaryLight: '#C49000',
  primaryMuted: 'rgba(139, 96, 0, 0.12)',

  // ─── Fondos ────────────────────────────────────────────────────────────────
  background: '#F8F7F4',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAF8',

  // ─── Textos ────────────────────────────────────────────────────────────────
  textPrimary: '#1A1A1A',
  textSecondary: '#8B7A50',
  textMuted: '#B0A890',
  textOnPrimary: '#FFFFFF',

  // ─── Bordes ────────────────────────────────────────────────────────────────
  border: '#E0DCCE',
  borderLight: '#F0EDE4',

  // ─── CTA ───────────────────────────────────────────────────────────────────
  black: '#1A1A1A',

  // ─── Semánticos ────────────────────────────────────────────────────────────
  successBg: '#F0FBF4',
  successText: '#1A7A3C',
  successBorder: '#A8E0BE',

  warningBg: '#FFF8EC',
  warningText: '#854F0B',
  warningBorder: '#F5D48A',

  dangerBg: '#FEF0F0',
  dangerText: '#A32D2D',
  dangerBorder: '#F7C1C1',

  neutralBg: '#F1EFE8',
  neutralText: '#5F5E5A',
  neutralBorder: '#D3D1C7',
} as const;

export default colors;
