import { join } from 'path';
import type { Config } from 'tailwindcss';

import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import { skeleton } from '@skeletonlabs/tw-plugin';

const config = {
	darkMode: 'selector',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {}
	},
	plugins: [
		typography,
		forms,
		skeleton({
			themes: {
				preset: ['crimson']
			}
		})
	]
} satisfies Config;

export default config;
