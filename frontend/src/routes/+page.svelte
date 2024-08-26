<script lang="ts">
	import Mailbox from '$lib/components/mailbox/Mailbox.svelte';
	import { Mail as MailIcon } from 'lucide-svelte';
	import { username } from '$lib/stores/mailbox';
	import { ofetch } from 'ofetch';
	import { goto } from '$app/navigation';

	const emailDomain = import.meta.env.VITE_EMAIL_DOMAIN as string;

	function refreshPage() {
		goto(window.location.href);
	}
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
				<div class="input-group-shim"><MailIcon size="1.4rem" /></div>
				<input type="text" placeholder="shark" bind:value={$username} />
				<div class="input-group-shim">@{emailDomain}</div>
			</div>
		</div>

		<hr />

		<div>
			{#await ofetch(`${import.meta.env.VITE_API_ENDPOINT}/emails/${$username}@${emailDomain}`)}
				<div
					class="light-bg dark:bg-surface-500 flex items-center justify-center rounded-md p-6 shadow-sm"
				>
					<p class="text-lg font-semibold">One sec...</p>
				</div>
			{:then emails}
				<Mailbox {emails} />
			{/await}
			<p class="my-4 text-gray-400">
				Hint: <a href="/" class="text-sky-400 hover:underline" on:click={refreshPage}
					>refresh the page</a
				> to see new emails.
			</p>
		</div>
	</div>
</div>
