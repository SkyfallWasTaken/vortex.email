<script lang="ts">
	import type { Email } from '$lib/email';
	import MailboxEmail from './Email.svelte';
	export let emails: Email[];

	console.log(emails);
</script>

<div class="dark:bg-surface-500 light-bg rounded-md p-6 shadow-sm">
	{#if emails.length != 0}
		<div class="flex flex-col gap-3">
			{#each emails as email}
				<div class="border-b border-gray-400 pb-2 last:border-b-0 last:pb-0 dark:border-slate-700">
					<MailboxEmail {email} />
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-lg font-semibold">No emails... yet</p>
		<p>You're all caught up! Go out and do what you do best.</p>
	{/if}
</div>

<style>
	.light-bg {
		background-color: rgb(var(--color-surface-400) / 0.1);
	}
</style>
