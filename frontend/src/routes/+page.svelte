<script lang="ts">
	import AtSign from 'lucide-svelte/icons/at-sign';
</script>

<div class="container mx-auto flex h-full items-center justify-center">
	<div class="flex flex-col items-center space-y-10 text-center">
		<h2 class="h2">Free, disposable email addresses</h2>

		<p class="text-lg">
			Need an email to download a PDF or join a newsletter for a discount?
			<br />
			Use Vortex on a website that requires email verification and never worry about spam emails again.
		</p>

		<div class="flex flex-col gap-4">
			<p class="text-xl font-semibold">You are</p>
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim"><AtSign /></div>
				<input type="text" placeholder="shark" />
				<div class="input-group-shim">@vortex.gg</div>
			</div>
		</div>

		<div class="flex justify-center space-x-2">
			<a class="variant-filled btn" href="https://skeleton.dev/" target="_blank" rel="noreferrer">
				Launch Documentation
			</a>
		</div>
	</div>
</div>
