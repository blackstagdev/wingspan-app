<script lang="ts">
	import { onMount } from 'svelte';

	let orders = $state([]); // still populated by loadData (unused on purpose)
	let transactions = $state([]);

	let totalOrders = $state(0); // unused but preserved
	let totalTransactions = $state(0);

	let saving = $state(false);
	let message = $state('');
	let log = $state([]); // 🪵 batch logs

	// ✅ DO NOT CHANGE (as requested)
	async function loadData() {
		const res = await fetch('/api/goaffpro/consolidated');
		const data = await res.json();

		orders = data?.orders ?? [];
		transactions = data?.transactions ?? [];
		console.log(transactions);

		totalOrders = data?.total_orders ?? 0;
		totalTransactions = data?.total_transactions ?? 0;
	}

	onMount(() => {
		loadData();
		$inspect(`💸 Loaded ${totalTransactions} transactions`);
	});

	// ✅ Save TRANSACTIONS ONLY
	async function saveToSupabase() {
		if (totalTransactions === 0) {
			alert('No transactions to save.');
			return;
		}

		saving = true;
		message = 'Saving transactions... please wait ⏳';
		log = [];

		const BATCH_SIZE = 1000;
		let totalInserted = 0;
		let failedBatches = 0;

		try {
			//clear
			log = [...log, '🧹 Clearing affiliate_transaction table...'];

			const clearRes = await fetch('/api/goaffpro/clearTransactions', {
				method: 'POST'
			});

			const clearResult = await clearRes.json();
			if (!clearRes.ok || !clearResult.success) {
				throw new Error('Failed to clear affiliate_transaction table');
			}

			log = [...log, '✅ affiliate_transaction cleared'];

			//insert
			for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
				const batch = transactions.slice(i, i + BATCH_SIZE);
				const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

				log = [...log, `📦 Sending batch ${batchNumber} (${batch.length} transactions)`];

				const res = await fetch('/api/goaffpro/saveAff', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ transactions: batch })
				});

				const result = await res.json();

				if (res.ok && result.success) {
					totalInserted += batch.length;
					log = [...log, `✅ Batch ${batchNumber} saved (${batch.length})`];
				} else {
					failedBatches++;
					log = [...log, `❌ Batch ${batchNumber} failed: ${result.error || 'Unknown error'}`];
				}
			}

			message =
				`✅ Saved ${totalInserted} transactions` +
				(failedBatches ? ` (${failedBatches} batches failed)` : '');
		} catch (err) {
			message = `❌ Save failed: ${err.message}`;
			console.error(err);
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6 p-6">
	<h1 class="text-2xl font-bold">Affiliate Transactions Admin</h1>

	<!-- 🔘 Action -->
	<button
		on:click={saveToSupabase}
		class="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
		disabled={saving}
	>
		{saving ? 'Saving...' : `Save Transactions (${totalTransactions})`}
	</button>

	{#if message}
		<p class="text-sm font-medium">{message}</p>
	{/if}

	<!-- 🧾 Logs -->
	<div class="max-h-[200px] overflow-auto rounded border bg-gray-50 p-2 text-xs text-gray-700">
		{#each log as line}
			<div>{line}</div>
		{/each}
	</div>

	<!-- 🧩 Preview transactions -->
	<div class="max-h-[400px] overflow-auto rounded border p-3 text-sm text-gray-700">
		<h2 class="mb-2 font-semibold">Preview (first 10 transactions)</h2>

		{#each transactions.slice(0, 10) as t}
			<div class="border-b py-2">
				<div class="font-medium">{t.affiliate_name}</div>
				<div class="text-xs text-gray-500">
					{t.affiliate_email} • EIN: {t.ein}
				</div>
				<div class="text-xs text-gray-500">
					{t.entity_type} • {t.store} • ${Number(t.amount).toFixed(2)} • {t.date}
				</div>
			</div>
		{/each}
	</div>
</div>
