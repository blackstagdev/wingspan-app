<script>
	import { supabase } from '$lib/supabaseClient';

	let email = '';
	let message = '';
	let error = '';
	let loading = false;

	async function sendReset() {
		error = '';
		message = '';
		loading = true;

		const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
			// redirectTo: 'http://localhost:5173/reset-password'
			redirectTo: 'https://wingspan-app.vercel.app/reset-password'
		});

		if (err) error = err.message;
		else message = 'Password reset email sent! Check your inbox.';

		loading = false;
	}
</script>

<div class="mx-auto mt-10 max-w-xl justify-center">
	<h1 class="mb-4 text-2xl font-bold">Reset Password</h1>

	<form on:submit|preventDefault={sendReset} class="space-y-4">
		<input
			type="email"
			bind:value={email}
			placeholder="Enter your email"
			class="w-full rounded border p-2"
			required
		/>

		<!-- Button with loading spinner -->
		<button
			type="submit"
			class="flex w-full cursor-pointer items-center justify-center rounded bg-blue-500 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
			disabled={loading}
		>
			{#if loading}
				<!-- Small spinner -->
				<svg
					class="h-5 w-5 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
					></path>
				</svg>
				<span class="ml-2">Sending...</span>
			{:else}
				Send reset email
			{/if}
		</button>

		{#if error}
			<p class="text-red-500">{error}</p>
		{/if}

		{#if message}
			<p class="text-green-600">{message}</p>
		{/if}
	</form>
</div>
