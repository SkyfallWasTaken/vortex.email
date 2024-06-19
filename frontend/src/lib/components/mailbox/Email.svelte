<script lang="ts">
	import type { Email } from '$lib/email';
	import PostalMime from 'postal-mime';

	export let email: Email;
	console.log(email);
</script>

<div class="flex gap-4">
	{#await PostalMime.parse(email.data) then parsedEmail}
		<p class="{!email.read ? 'font-semibold' : ''} truncate">
			{email.mail_from}
		</p>
		<p class="{!email.read ? 'font-semibold' : ''} truncate">
			{parsedEmail.subject || 'No subject'}
		</p>
		<p class="hidden truncate sm:block">
			{parsedEmail.text?.substring(0, 100) || parsedEmail.html?.substring(0, 100) || 'No content'}
		</p>
	{/await}
</div>
