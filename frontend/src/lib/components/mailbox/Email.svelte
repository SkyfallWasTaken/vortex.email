<script lang="ts">
	import type { Email } from '$lib/email';
	import { type Email as PostalEmail } from 'postal-mime';
	import { AccordionItem } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import PostalMime from 'postal-mime';

	export let email: Email;

	let iframe: HTMLIFrameElement | null = null;
	let parsedEmail: PostalEmail | null = null;

	onMount(async () => {
		parsedEmail = await PostalMime.parse(email.data);
	});

	$: if (iframe && parsedEmail) {
		iframe.addEventListener('load', function () {
			const iframeDocument = this.contentDocument || this.contentWindow?.document;
			if (iframeDocument) {
				iframeDocument.addEventListener('click', (event: MouseEvent) => {
					const target = event.target as HTMLAnchorElement;

					if (target.tagName === 'A' && target.href) {
						event.preventDefault();
						window.open(target.href, '_blank');
					}
				});
			}
		});
		const styling = `
			<style>
				body {
					font-family: Arial, Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
				}
			</style>
		`
		const blob = new Blob([styling, parsedEmail.html || parsedEmail.text || ''], { type: 'text/html' });
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
