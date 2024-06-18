<script lang="ts">
	import AtSign from 'lucide-svelte/icons/at-sign';
	import Mailbox from '$lib/components/mailbox/Mailbox.svelte';
	import type { Email } from '$lib/email';
	import { Mail } from 'lucide-svelte';
	import { username } from '$lib/stores/mailbox';

	let emails: Email[] = [
		{
			from: 'hi@skyfall.io',
			subject: 'Welcome to Vortex!',
			content: 'Welcome to Vortex! We are excited to have you on board.',
			timestamp: Date.now().toString(),
			id: 0,
			read: false
		},
		{
			from: 'hi@skyfall.io',
			subject: 'Welcome to Vortex!',
			content: 'Welcome to Vortex! We are excited to have you on board.',
			timestamp: Date.now().toString(),
			id: 0,
			read: false
		}
	];
</script>

<svelte:head>
	<title>Vortex - Free, disposable email addresses</title>
</svelte:head>

<div class="container mx-auto flex h-full items-center justify-center">
	<div class="flex flex-col items-center space-y-10 text-center">
		<h2 class="h2">Free, disposable email addresses</h2>

		<p class="text-lg">
			Need an email to download a PDF or join a newsletter for a discount?
			<br />
			Use Vortex on a website that requires email verification and never worry about spam emails again.
		</p>

		<div class="flex flex-col gap-4">
			<p class="text-xl font-semibold">You are...</p>
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim"><AtSign size="1.1rem" /></div>
				<input type="text" placeholder="shark" bind:value={$username} />
				<div class="input-group-shim">@vortex.gg</div>
			</div>
		</div>

		<div>
			<Mailbox {emails} />
		</div>
	</div>
</div>
