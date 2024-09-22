<script lang="ts">
	import type { Email } from '$lib/email';
	import { Accordion } from '@skeletonlabs/skeleton';
	import MailboxEmail from './Email.svelte';
	export let emails: Email[];
</script>

<div class="flex w-screen justify-center">
	<div class="light-bg dark:bg-surface-500 w-5/6 rounded-md p-4 shadow-sm sm:w-4/5">
		{#if emails.length != 0}
			<Accordion>
				{#each emails as email}
					<div
						class="border-b border-gray-400 pb-2 last:border-b-0 last:pb-0 dark:border-slate-700"
					>
						<MailboxEmail {email} />
					</div>
				{/each}
			</Accordion>
		{:else}
			<h2 class="text-lg font-semibold">No emails... yet</h2>
			<p>You're all caught up! Go out and do what you do best.</p>
		{/if}
	</div>
</div>

<style>
	.light-bg {
		background-color: rgb(var(--color-surface-400) / 0.1);
	}
</style>
