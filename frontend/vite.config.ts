import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	envDir: '../',
	build: {
		rollupOptions: {
			external: ['@macfja/svelte-persistent-store', '@faker-js/faker', '@sveltejs/kit']
		}
	}
});
