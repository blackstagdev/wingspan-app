<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Get current URL info
		const { pathname, search, hash } = window.location;

		const isRoot = pathname === '/';
		const hasParams = search.length > 0;
		const hasHash = hash.length > 0;

		if (isRoot && !hasParams && !hasHash) {
			goto('/dashboard');
		}
	});
</script>

<p>Redirecting to dashboard...</p>
