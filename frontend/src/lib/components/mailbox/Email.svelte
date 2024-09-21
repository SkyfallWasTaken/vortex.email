<script lang="ts">
	import type { Email } from '$lib/email';
	import { AccordionItem } from '@skeletonlabs/skeleton';
	import PostalMime from 'postal-mime';
	import { type Email as PostalEmail } from 'postal-mime';
	import { onMount } from 'svelte';

	export let email: Email;

	let iframe: HTMLIFrameElement | null = null;
	let parsedEmail: PostalEmail | null = null;

	onMount(async () => {
		parsedEmail = await PostalMime.parse(email.data);
	});

	$: if (iframe && parsedEmail) {
		const blob = new Blob([parsedEmail.html || parsedEmail.text || ''], { type: 'text/html' });
		iframe.src = window.URL.createObjectURL(blob);
	}
</script>

{#if parsedEmail}
	<AccordionItem>
		<svelte:fragment slot="summary">
			<div class="flex gap-4">
				<p
					class={`${!email.read ? 'font-semibold' : ''} max-w-xs truncate sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl`}
				>
					{parsedEmail.from?.name || email.mail_from || 'No sender'}
				</p>
				<p class={`${!email.read ? 'font-semibold' : ''} max-w-xs truncate sm:max-w-sm`}>
					{parsedEmail.subject || 'No subject'}
				</p>
				<p class="max-w-xs truncate sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
					{parsedEmail.text?.substring(0, 130) ||
						parsedEmail.html?.substring(0, 130) ||
						'No content'}
				</p>
			</div>
		</svelte:fragment>

		<svelte:fragment slot="content">
			{#if parsedEmail.html}
				<iframe
					bind:this={iframe}
					class="h-full w-full"
					style="height: 50vh; background-color: white;"
					frameborder="0"
					title={parsedEmail.subject || 'No subject'}
					sandbox="allow-same-origin allow-popups"
				></iframe>
			{:else if parsedEmail.text}
				<div class="whitespace-pre-wrap text-left">
					{parsedEmail.text}
				</div>
			{/if}
		</svelte:fragment>
	</AccordionItem>
{/if}

<style>
	.accordion-summary {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
