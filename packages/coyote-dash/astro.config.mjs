// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	output: 'server', // Server-rendered para que middleware funcione
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
		server: {
			proxy: {
				// Proxy API requests al backend para evitar CORS
				'/api': {
					target: 'http://localhost:3000',
					changeOrigin: true,
					secure: false,
				}
			}
		}
	},
});
