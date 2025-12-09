<script>
	export let form;
	let showPassword = false;
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-lg rounded-xl bg-white p-12 shadow-lg">
		<h1 class="mb-6 text-center text-3xl font-bold text-gray-800">BSD Wingspan Dashboard</h1>

		<form method="POST" class="space-y-6">
			<!-- Email Field -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-600" for="email"> Email </label>
				<input
					id="email"
					name="email"
					type="email"
					placeholder="Enter your email"
					required
					class="w-full rounded border border-gray-300 p-2 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
				/>
			</div>

			<!-- Password Field -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-600" for="password">
					Password
				</label>

				<div class="relative">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="Enter your password"
						required
						class="w-full rounded border border-gray-300 p-2 pr-10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
					/>

					<!-- Toggle button -->
					<button
						type="button"
						on:click={() => (showPassword = !showPassword)}
						class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
						aria-label="Toggle password visibility"
					>
						{#if showPassword}
							<!-- eye-off icon -->
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
									d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.058.168-2.076.48-3.032m3.654-1.611A9.97 9.97 0 0112 3c5.523 0 10 4.477 10 10a9.958 9.958 0 01-2.099 6.182M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 3l18 18"
								/>
							</svg>
						{:else}
							<!-- eye icon -->
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
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Submit -->
			<button
				type="submit"
				class="mt-4 w-full rounded bg-blue-500 py-3 font-bold text-white transition hover:bg-blue-600"
			>
				Log In
			</button>
			<div class="flex justify-end">
				<a href="/forgot-password" class="text-sm text-blue-600 hover:underline">
					Forgot your password?
				</a>
			</div>

			{#if form?.error}
				<p class="mt-3 text-center text-sm text-red-500">{form.error}</p>
			{/if}
		</form>
	</div>
</div>
