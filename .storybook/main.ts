import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-themes',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  // Storybook inherits the JS library config, which deliberately does not compile CSS.
  viteFinal: (config) => ({
    ...config,
    plugins: [...(config.plugins ?? []), tailwindcss()],
  }),
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
export default config;
