<script lang="ts">
	import Mailbox from '$lib/components/mailbox/Mailbox.svelte';
	import CopyIcon from 'lucide-svelte/icons/copy';
	import CopyCheckIcon from 'lucide-svelte/icons/copy-check';
	import { username } from '$lib/stores/mailbox';
	import { ofetch } from 'ofetch';
	import { createQuery } from '@tanstack/svelte-query';
	import { debounce } from '$lib/util';
	import type { Email } from '$lib/email';
	import { derived } from 'svelte/store';

	const emailDomain = import.meta.env.VITE_EMAIL_DOMAIN as string;

	function refreshPage() {
		window.location.reload();
	}

	function setUsername(event: KeyboardEvent) {
		username!.set((event.target as HTMLInputElement).value);
	}

	type CopyButtonState = 'idle' | 'copied';
	let copyButtonState: CopyButtonState = 'idle';
	function copyEmail() {
		navigator.clipboard.writeText(`${$username}@${emailDomain}`);
		copyButtonState = 'copied';
		setTimeout(() => {
			copyButtonState = 'idle';
		}, 1000);
	}

	const query = createQuery<Email[]>(
		derived(username!, ($username) => ({
			queryKey: ['emails', $username, emailDomain],
			queryFn: async () => {
				const response = await ofetch<Email[]>(
					`${import.meta.env.VITE_API_ENDPOINT}/emails/${$username}@${emailDomain}`
				);
				return response;
			},
			refetchInterval: 10000
		}))
	);
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
				<button class="input-group-shim" on:click={copyEmail}>
					{#if copyButtonState === 'idle'}
						<CopyIcon size="1.4rem" />
					{:else}
						<CopyCheckIcon size="1.4rem" />
					{/if}
				</button>
				<input type="text" placeholder="shark" on:keyup={debounce(setUsername)} value={$username} />
				<div class="input-group-shim">@{emailDomain}</div>
			</div>
		</div>

		<hr />

		<div>
			{#if $query.isLoading}
				<div
					class="light-bg flex items-center justify-center rounded-md p-6 shadow-sm dark:bg-surface-500"
				>
					<p class="text-lg font-semibold">One sec...</p>
				</div>
			{:else if $query.isError}
				<div
					class="light-bg flex flex-col items-center justify-center rounded-md p-6 shadow-sm dark:bg-surface-500"
				>
					<h2 class="text-lg font-semibold">Uh oh, something went wrong</h2>
					<p>Sorry about that! Please refresh the page and try again.</p>
				</div>
			{:else if $query.isSuccess}
				<Mailbox emails={$query.data} />
			{/if}
			<p class="my-4 text-gray-400">
				Hint: Wait for 10 seconds or <a
					href="/"
					class="text-sky-400 hover:underline"
					on:click={refreshPage}>refresh the page</a
				> to see new emails.
			</p>
		</div>
	</div>
</div>
