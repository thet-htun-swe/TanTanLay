/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#B76450';
const tintColorDark = '#F5B39C';

export const Colors = {
  light: {
    text: '#4D586E',
    background: '#FFFDFC',
    tint: tintColorLight,
    tintOpacity: '#B7645080',
    icon: '#7D8798',
    tabIconDefault: '#7D8798',
    tabIconSelected: tintColorLight,
    border: '#E9DCD7',
    cardBackground: '#FFFFFF',
    surface: '#F9F1EE',
    muted: '#7D8798',
    success: '#5A977F',
    warning: '#C58A42',
    danger: '#C85D68',
    onTint: '#FFFFFF',
  },
  dark: {
    text: '#F5F0F3',
    background: '#191B23',
    tint: tintColorDark,
    tintOpacity: '#F5B39C80',
    icon: '#B9B3C1',
    tabIconDefault: '#B9B3C1',
    tabIconSelected: tintColorDark,
    border: '#393543',
    cardBackground: '#252630',
    surface: '#302C37',
    muted: '#B9B3C1',
    success: '#8EC6A8',
    warning: '#E5BA78',
    danger: '#F09AA3',
    onTint: '#302129',
  },
};
