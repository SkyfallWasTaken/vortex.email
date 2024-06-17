<script lang="ts">
	import type { Email } from '$lib/email';
	export let email: Email;
</script>

<div class="flex gap-4">
	<p class="{!email.read ? 'font-semibold' : ''} truncate">
		{email.from}
	</p>
	<p class="{!email.read ? 'font-semibold' : ''} truncate">
		{email.subject}
	</p>
	<p class="hidden truncate sm:block">
		{email.content}
	</p>
</div>
