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
				<p class="{!email.read ? 'font-semibold' : ''} truncate">
					{parsedEmail.from.name || email.mail_from || 'No sender'}
				</p>
				<p class="{!email.read ? 'font-semibold' : ''} truncate">
					{parsedEmail.subject || 'No subject'}
				</p>
				<p class="hidden truncate sm:block">
					{parsedEmail.text?.substring(0, 100) ||
						parsedEmail.html?.substring(0, 100) ||
						'No content'}
				</p>
			</div>
		</svelte:fragment>

		<svelte:fragment slot="content">
			<iframe title={parsedEmail.subject} frameborder="0" sandbox="" bind:this={iframe}></iframe>
		</svelte:fragment>
	</AccordionItem>
{/if}
