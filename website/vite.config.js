import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/agent-marketplace-template/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}));
