import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Vite configuration tailored for fast overlay iteration.
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
  }
});
