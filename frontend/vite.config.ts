import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'zephyr-labs',
				project: 'vortex'
			}
		}),
		sveltekit()
	],
	envDir: '../',
	build: {
		rollupOptions: {
			external: ['@macfja/svelte-persistent-store', '@faker-js/faker', '@sveltejs/kit']
		}
	}
});
