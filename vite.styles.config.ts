import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        styles: 'src/styles.css',
        'styles.light': 'src/styles.light.css',
        'styles.dark': 'src/styles.dark.css',
      },
      output: {
        assetFileNames: (asset) => {
          const name = asset.originalFileNames[0]?.split('/').pop();
          if (!name) throw new Error('Stylesheet asset has no name');
          return name;
        },
      },
    },
  },
});
