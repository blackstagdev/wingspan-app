<script>
	let loading = false;
	let result = null;
	let error = null;

	async function sendToWingspan() {
		loading = true;
		result = null;
		error = null;

		try {
			// STEP 1: Add collaborator to the batch
			const addRes = await fetch('/api/wingspan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					batchId: 'TZPxe_AeIyml0zLf8MZ8RF',
					collaborator: {
						email: 'payee.two@example.com',
						externalId: 'abl-payee-1003',
						formW9Data: {
							firstName: 'John',
							lastName: 'Doe',
							addressLine1: '123 Main St',
							city: 'Anytown',
							state: 'CA',
							postalCode: '12345',
							country: 'US'
						}
					}
				})
			});

			const addData = await addRes.json();

			if (!addRes.ok) throw new Error(JSON.stringify(addData));

			// ✅ Collaborator successfully added
			console.log('Collaborator added:', addData);

			// STEP 2: Close the batch
			const closeRes = await fetch('/api/wingspan/close', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ batchId: 'TZPxe_AeIyml0zLf8MZ8RF' })
			});

			const closeData = await closeRes.json();

			if (!closeRes.ok) throw new Error(JSON.stringify(closeData));

			// ✅ Batch closed successfully
			console.log('Batch closed:', closeData);

			// Combine both responses for UI display
			result = {
				addCollaborator: addData,
				closeBatch: closeData
			};
		} catch (err) {
			console.error('Error:', err);
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<h1>Welcome to blackstag wingspan</h1>

<button
	on:click={sendToWingspan}
	disabled={loading}
	class="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
>
	{#if loading}
		Processing...
	{:else}
		Send to Wingspan
	{/if}
</button>

{#if result}
	<pre class="mt-4 rounded bg-gray-100 p-2">{JSON.stringify(result, null, 2)}</pre>
{/if}

{#if error}
	<p class="mt-2 text-red-600">Error: {error}</p>
{/if}
