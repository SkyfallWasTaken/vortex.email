<script>
	import Header from '$lib/components/Header.svelte';
	import '../app.css';
</script>

<Header />
<main class="mt-20 px-5 md:px-3 lg:px-0">
	<slot />
</main>
