import type { Config } from "@react-router/dev/config";

export default {
	// Vercel doesn't support SSR :skull:
	ssr: false,
} satisfies Config;
