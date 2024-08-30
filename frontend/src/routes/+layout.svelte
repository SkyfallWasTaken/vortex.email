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
</script>

<QueryClientProvider client={queryClient}>
	<Header />
	<main class="mt-20 px-5 md:px-3 lg:px-0">
		<slot />
	</main>
</QueryClientProvider>
