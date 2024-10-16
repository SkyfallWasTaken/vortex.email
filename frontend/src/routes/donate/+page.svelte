<script lang="ts">
	import ArrowLeftIcon from 'lucide-svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Donate - Vortex</title>
</svelte:head>

<div class="container mx-auto flex w-4/5 flex-col justify-center gap-4 p-4 lg:w-1/2">
	<div>
		<h1 class="mb-2 text-3xl font-bold">Donate to Vortex</h1>
      <p>If Vortex has been useful, I'd really appreciate a donation on my Ko-Fi! Your support will help me buy more domains for the site, improve and add new features, and help a teen out :) </p>
	</div>
	<iframe id='kofiframe' src='https://ko-fi.com/skyfalldev/?hidefeed=true&widget=true&embed=true&preview=true' style='border:none;width:100%;padding:4px;background:#f9f9f9;' height='712' title='skyfalldev'></iframe>
	<hr class="my-4" />
	<a href="/" class="btn border-gray-300 p-1">
		<ArrowLeftIcon size="1.2rem" class="mr-2" />
		<p>Go back home...</p>
	</a>
</div>
