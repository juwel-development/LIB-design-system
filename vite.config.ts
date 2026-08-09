import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

// Library mode: peers stay external so consumers deduplicate React themselves.
// tsconfigPaths mirrors depot-tracker's non-relative imports ('Interaction/Button/Button').
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), libInjectCss(), react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DesignSystem',
      fileName: 'design-system',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'rxjs'],
    },
  },
});
