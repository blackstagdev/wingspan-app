<script>
	import { onMount } from 'svelte';
	import supabase from '$lib/supabaseServer.js';

	let stage = $state('loading');
	let password = $state('');

	onMount(async () => {
		// This extracts the token from the URL hash
		const { data, error } = await supabase.auth.getSession();

		if (error) {
			console.error(error);
			stage = 'error';
			return;
		}

		stage = 'ready';
	});

	async function updatePassword(newPassword) {
		const { error } = await supabase.auth.updateUser({
			password: newPassword
		});

		if (!error) {
			stage = 'done';
		} else {
			console.error(error);
		}
	}
</script>

{#if stage === 'loading'}
	<p>Processing password reset...</p>
{:else if stage === 'ready'}
	<form onsubmit={() => updatePassword(password)}>
		<input type="password" bind:value={password} placeholder="New Password" />
		<button>Set Password</button>
	</form>
{:else if stage === 'done'}
	<p>Password updated! You can now <a href="/login">log in</a>.</p>
{:else}
	<p>Error. Invalid or expired reset link.</p>
{/if}
