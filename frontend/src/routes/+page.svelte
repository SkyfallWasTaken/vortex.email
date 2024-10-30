<script lang="ts">
	import type { Email } from '$lib/email';
	import Mailbox from '$lib/components/mailbox/Mailbox.svelte';
	import CopyIcon from 'lucide-svelte/icons/copy';
	import CopyCheckIcon from 'lucide-svelte/icons/copy-check';
	import { username, emailDomain as emailDomainStore, emailDomains } from '$lib/mailbox';
	import { createQuery } from '@tanstack/svelte-query';
	import { debounce } from '$lib/util';
	import { derived } from 'svelte/store';

	function refreshPage() {
		window.location.reload();
	}

	function setUsername(event: KeyboardEvent) {
		username!.set((event.target as HTMLInputElement).value);
	}

	type CopyButtonState = 'idle' | 'copied';
	let copyButtonState: CopyButtonState = 'idle';
	function copyEmail() {
		navigator.clipboard.writeText(`${$username}@${$emailDomainStore}`);
		copyButtonState = 'copied';
		setTimeout(() => {
			copyButtonState = 'idle';
		}, 1000);
	}

	const query = createQuery<Email[]>(
		derived([username, emailDomainStore], ([$username, emailDomain]) => ({
			queryKey: ['emails', $username, emailDomain],
			queryFn: async () => {
				const response = await fetch(
					`${import.meta.env.VITE_API_ENDPOINT}/emails/${$username}@${emailDomain}`
				);
				if (!response.ok) {
					throw new Error('Failed to fetch emails');
				}
				const json: Email[] = await response.json();
				return json;
			},
			refetchInterval: 10000
		}))
	);

	$: if ($query.isError) {
		try { umami.track('error-fetching-emails'); } catch {}
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
				<button
					class="input-group-shim"
					on:click={copyEmail}
					data-umami-event="copy-email"
					data-umami-event-email-domain={$emailDomainStore}
					aria-label={copyButtonState === 'idle'
						? 'Copy email to clipboard'
						: 'Copied email to clipboard!'}
				>
					{#if copyButtonState === 'idle'}
						<CopyIcon size="1.4rem" />
					{:else}
						<CopyCheckIcon size="1.4rem" />
					{/if}
				</button>
				<input type="text" placeholder="shark" on:keyup={debounce(setUsername)} value={$username} />
				<select bind:value={$emailDomainStore} aria-label="Select email domain">
					{#each emailDomains as domain}
						<option value={domain}>@{domain}</option>
					{/each}
				</select>
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
					class="text-sky-400 underline"
					data-umami-event="refresh-link-clicked"
					on:click={refreshPage}>refresh the page</a
				> to see new emails.
			</p>
		</div>
	</div>
</div>
