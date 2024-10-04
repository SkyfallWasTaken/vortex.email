<script>
	import { browser } from '$app/environment';
	import Header from '$lib/components/Header.svelte';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import '../app.css';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser
			}
		}
	});

	const umamiScript = import.meta.env.VITE_UMAMI_SCRIPT;
	const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
</script>

<svelte:head>
	{#if umamiScript}
		<script defer src={umamiScript} data-website-id={umamiWebsiteId}></script>
	{/if}
</svelte:head>

<QueryClientProvider client={queryClient}>
	<Header />
	<main class="mt-20 px-5 md:px-3 lg:px-0">
		<slot />
	</main>
</QueryClientProvider>
