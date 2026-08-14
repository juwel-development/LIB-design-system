import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';

import '../src/styles.css';
// styles.css is light-only (issue #62); the theme toggle needs the opt-in dark layer too.
import '../src/tokens.dark.css';
import './storybook.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      source: {
        type: 'code',
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        // nameOfTheme: 'classNameForTheme',
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
