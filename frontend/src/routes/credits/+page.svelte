<script lang="ts">
	import ArrowLeftIcon from 'lucide-svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Credits - Vortex</title>
</svelte:head>

<div class="container mx-auto flex w-4/5 flex-col justify-center gap-4 p-4 lg:w-1/2">
	<div>
		<h1 class="mb-2 text-3xl font-bold">Credits</h1>
		<p>Thank you to the following people for their contributions to Vortex:</p>
	</div>
	<ul class="list-disc">
		<li>
			<a href="https://pixelverse.tech/" target="_blank" class="underline">Hayden Kong/Pixelverse</a
			>
			for the
			<b>shadow.pixelverse.tech, assembly.pixelverse.tech, and corporate.pixelverse.tech</b> subdomains
		</li>
		<li>
			<a href="https://hackclub.com/" target="_blank" class="underline">Hack Club</a> for the
			<b>shadow.dino.icu, erdtree.dino.icu, and vortex.dino.icu</b> subdomains
		</li>
		<li>
			<a href="https://mattsoh.dev/" target="_blank" class="underline">Matthew Soh</a> for the
			<b>vortex.mattsoh.dev</b> subdomain
		</li>
		<li>
			<a href="https://nic.us.kg/" target="_blank" class="underline">us.kg</a> for the
			<b>postal.us.kg, postoffice.us.kg, and vortex.us.kg</b> domains
		</li>
	</ul>
	<hr class="my-4" />
	<a href="/" class="btn border-gray-300 p-1">
		<ArrowLeftIcon size="1.2rem" class="mr-2" />
		<p>Go back home...</p>
	</a>
</div>
