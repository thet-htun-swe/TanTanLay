/**
 * App colours, light and dark.
 *
 * Primary = purple from the app icon (the lavender shirt), deepened so it can
 * be used for buttons and text. Secondary = mint from the icon (the dress),
 * used for positive things: discounts, "up" changes, selections.
 *
 * Made for long use: soft off-white / deep purple-grey backgrounds (no pure
 * white or black), soft ink text, calm colours. Every text colour below meets
 * WCAG AA (>= 4.5:1) on cards and backgrounds in its mode.
 */

export const Colors = {
  light: {
    text: '#2E2A3A',
    background: '#F7F5FB',
    tint: '#6E4FB3',
    tintOpacity: '#6E4FB380',
    icon: '#6B6580',
    tabIconDefault: '#8A849C',
    tabIconSelected: '#6E4FB3',
    border: '#E3DCEE',
    cardBackground: '#FFFFFF',
    surface: '#F0EBF7',
    muted: '#6B6580',
    secondary: '#237A63',
    onSecondary: '#FFFFFF',
    // Soft mint wash for highlight areas (e.g. Home header)
    secondarySurface: '#E3F3EC',
    success: '#237A63',
    warning: '#9A5A12',
    danger: '#C0435A',
    onTint: '#FFFFFF',
    // Chart bars (checked with the dataviz palette validator on the card surface)
    chart: '#6E4FB3',
  },
  dark: {
    text: '#ECE8F3',
    background: '#16141D',
    tint: '#B9A1EE',
    tintOpacity: '#B9A1EE80',
    icon: '#A9A2B9',
    tabIconDefault: '#8C859D',
    tabIconSelected: '#B9A1EE',
    border: '#3A3548',
    cardBackground: '#211E2A',
    surface: '#2B2736',
    muted: '#A9A2B9',
    secondary: '#7FD3B6',
    onSecondary: '#0F2A21',
    secondarySurface: '#1D2E29',
    success: '#7FD3B6',
    warning: '#E9B872',
    danger: '#F0919F',
    onTint: '#221838',
    // Deeper than the tint: the light tint is too pale for bars on dark cards
    chart: '#9579D8',
  },
};
