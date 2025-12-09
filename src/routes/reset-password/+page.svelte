<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let stage = $state('loading');
	let password = $state('');
	let loading = $state(false);
	let showPassword = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		const { data, error } = await supabase.auth.getSession();

		if (error || !data?.session) {
			stage = 'error';
			return;
		}

		stage = 'ready';
	});

	async function updatePassword() {
		loading = true;
		errorMessage = '';

		const { error } = await supabase.auth.updateUser({
			password
		});

		if (error) {
			errorMessage = error.message;
			loading = false;
			return;
		}

		stage = 'done';
		loading = false;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-md rounded-xl bg-white p-10 shadow-lg">
		<!-- Loading Stage -->
		{#if stage === 'loading'}
			<div class="text-center">
				<svg class="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
				</svg>
				<p class="mt-4 text-gray-600">Processing password reset...</p>
			</div>

			<!-- Ready Stage -->
		{:else if stage === 'ready'}
			<h1 class="mb-4 text-2xl font-bold">Set a New Password</h1>

			<form on:submit|preventDefault={updatePassword} class="space-y-5">
				<div>
					<label class="mb-2 block text-sm text-gray-700">New Password</label>

					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							class="w-full rounded border p-2 pr-10 focus:border-blue-400 focus:ring-blue-400"
							placeholder="Enter new password"
							required
						/>

						<button
							type="button"
							class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
							on:click={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<!-- eye-off -->
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 
									         0-1.058.168-2.076.48-3.032m3.654-1.611A9.97 9.97 0 0112 3c5.523 
									         0 10 4.477 10 10a9.958 9.958 0 01-2.099 6.182M15 12a3 3 0 11-6 
									         0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 3l18 18"
									/>
								</svg>
							{:else}
								<!-- eye -->
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 
									         7-1.274 4.057-5.065 7-9.542 7-4.477 
									         0-8.268-2.943-9.542-7z"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				{#if errorMessage}
					<p class="text-sm text-red-500">{errorMessage}</p>
				{/if}

				<button
					class="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2 text-white disabled:opacity-50"
					disabled={loading}
				>
					{#if loading}
						<svg class="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
							/>
						</svg>
						<span class="ml-2">Updating...</span>
					{:else}
						Set Password
					{/if}
				</button>
			</form>

			<!-- Done Stage -->
		{:else if stage === 'done'}
			<h1 class="mb-4 text-center text-2xl font-bold">Password Updated 🎉</h1>
			<p class="mb-6 text-center text-gray-700">Your password has been successfully updated.</p>
			<a
				href="/login"
				class="block rounded bg-blue-600 py-2 text-center text-white hover:bg-blue-700"
			>
				Log In
			</a>

			<!-- Error Stage -->
		{:else}
			<div class="text-center">
				<p class="mb-4 font-semibold text-red-500">Invalid or expired reset link.</p>
				<a href="/forgot-password" class="text-blue-600 hover:underline"> Try again </a>
			</div>
		{/if}
	</div>
</div>
