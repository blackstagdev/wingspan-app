<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		const { pathname, search, hash } = window.location;

		const isRecovery = hash.includes('type=recovery');
		const isOnRoot = pathname === '/';

		if (isOnRoot && isRecovery) {
			goto(`/reset-password${hash}`);
			return;
		}

		const hasParams = search.length > 0;
		const hasHash = hash.length > 0;

		if (isOnRoot && !hasParams && !hasHash) {
			goto('/dashboard');
		}
	});
</script>

<p>Redirecting...</p>
