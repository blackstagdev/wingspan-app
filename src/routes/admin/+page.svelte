<script lang="ts">
	import { onMount } from 'svelte';

	let orders = $state([]);
	let totalOrders = $state(0);
	let saving = $state(false);
	let message = $state('');
	let log = $state([]); // 🪵 for batch logs

	// ✅ Fetch all consolidated order data
	async function loadOrders() {
		const res = await fetch('/api/goaffpro/consolidated');
		const data = await res.json();
		orders = data?.orders ?? [];
		totalOrders = data?.total_orders ?? 0;
	}

	onMount(() => {
		loadOrders();
		$inspect(`📦 Loaded ${totalOrders} records`);
		$inspect('📋 Sample order:', orders); // show just one object for clarity
	});

	// ✅ Trigger save to Supabase
	async function saveToSupabase() {
		if (totalOrders === 0) {
			alert('No records to save.');
			return;
		}

		saving = true;
		message = 'Saving records... please wait ⏳';
		log = []; // clear old logs
		console.log(`💾 Attempting to save ${totalOrders} records...`);

		const BATCH_SIZE = 1000;
		let totalInserted = 0;
		let failedBatches = 0;

		try {
			for (let i = 0; i < orders.length; i += BATCH_SIZE) {
				const batch = orders.slice(i, i + BATCH_SIZE);
				const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

				console.log(`📦 Sending batch ${batchNumber} (${batch.length} records)...`);
				log = [...log, `📦 Sending batch ${batchNumber} (${batch.length} records)...`];

				const res = await fetch('/api/goaffpro/saveAff', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(batch)
				});

				const result = await res.json();

				if (res.ok && result.success) {
					totalInserted += batch.length;
					log = [...log, `✅ Batch ${batchNumber} saved successfully (${batch.length} records)`];
				} else {
					failedBatches++;
					log = [...log, `❌ Batch ${batchNumber} failed: ${result.error || 'Unknown error'}`];
					console.error(`❌ Batch ${batchNumber} failed:`, result);
				}
			}

			message = `✅ Saved ${totalInserted} records successfully. ${failedBatches > 0 ? `(${failedBatches} batches failed)` : ''}`;
			console.log(message);
		} catch (err) {
			message = `❌ Save failed: ${err.message}`;
			console.error('Save error:', err);
		} finally {
			saving = false;
		}
	}
</script>

<div class="p-6">
	<h1 class="mb-4 text-2xl font-bold">Affiliate Orders</h1>

	<button
		on:click={saveToSupabase}
		class="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
		disabled={saving}
	>
		{saving ? 'Saving...' : `Save All (${totalOrders})`}
	</button>

	{#if message}
		<p class="mt-3 text-sm font-medium">{message}</p>
	{/if}

	<!-- 🧾 Log section -->
	<div class="mt-4 max-h-[200px] overflow-auto rounded border bg-gray-50 p-2 text-xs text-gray-700">
		{#each log as line}
			<div>{line}</div>
		{/each}
	</div>

	<!-- 🧩 Preview some data -->
	<div class="mt-6 max-h-[400px] overflow-auto rounded border p-3 text-sm text-gray-600">
		{#each orders.slice(0, 10) as row}
			<div class="border-b py-1">
				<strong>{row.affiliate_name}</strong> — {row.affiliate_email} — ${row.commission}
			</div>
		{/each}
	</div>
</div>
