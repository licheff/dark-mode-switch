import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Generates .d.ts type declaration files so consumers get autocomplete
    dts({
      include: ['src'],
      exclude: ['src/test', 'src/**/*.test.tsx'],
      outDir: 'dist',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'DarkModeSwitch',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // These packages must be provided by the consuming project — don't bundle them
      external: ['react', 'react-dom', 'react/jsx-runtime', 'next-themes', 'lucide-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'next-themes': 'NextThemes',
          'lucide-react': 'LucideReact',
        },
      },
    },
    // Output all CSS into a single style.css rather than splitting per chunk
    cssCodeSplit: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
