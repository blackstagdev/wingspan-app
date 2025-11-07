<script>
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';

	let allOrders = $state([]);
	let filteredOrders = $state([]);
	let consolidatedOrders = $state([]);

	let search = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let loading = $state(false);

	let currentPage = $state(1);
	const pageSize = 50;

	let filtersActive = $state(false);

	onMount(loadOrders);

	// 🧲 Fetch orders
	async function loadOrders() {
		try {
			loading = true;
			console.log('📦 Fetching affiliate orders...');
			const res = await fetch('/api/goaffpro/getAff');
			const data = await res.json();

			if (res.ok && data.orders) {
				// Convert all dates to PST immediately
				allOrders = data.orders.map((o) => ({
					...o,
					createdPST: DateTime.fromISO(o.created, { zone: 'utc' })
						.setZone('America/Los_Angeles')
						.toISO()
				}));

				filteredOrders = allOrders;
				consolidatedOrders = consolidateData(allOrders);
				console.log(`✅ Loaded ${data.total_orders} records from Supabase`);
			} else {
				console.error('❌ Failed to load orders:', data.error);
			}
		} catch (err) {
			console.error('❌ Error loading orders:', err);
		} finally {
			loading = false;
		}
	}

	// 🧮 Consolidate by EIN (grouping all transactions) using PST dates
	function consolidateData(orders) {
		const map = new Map();

		for (const o of orders) {
			const key = o.ein || 'N/A';
			const createdPST = o.createdPST;
			const commission = Number(o.commission) || 0;

			if (!map.has(key)) {
				map.set(key, {
					ein: o.ein,
					affiliate_name: o.affiliate_name,
					affiliate_email: o.affiliate_email,
					total_commission: commission,
					abm_commission: o.store === 'alpha_biomed' ? commission : 0,
					paramount_commission: o.store === 'paramount_peptide' ? commission : 0,
					peptideu_commission: o.store === 'the_peptide_university' ? commission : 0,
					statuses: new Set([o.status]),
					first_created: createdPST,
					last_created: createdPST
				});
			} else {
				const item = map.get(key);
				item.total_commission += commission;
				if (o.store === 'alpha_biomed') item.abm_commission += commission;
				if (o.store === 'paramount_peptide') item.paramount_commission += commission;
				if (o.store === 'the_peptide_university') item.peptideu_commission += commission;
				item.statuses.add(o.status);

				if (DateTime.fromISO(createdPST) < DateTime.fromISO(item.first_created)) {
					item.first_created = createdPST;
				}
				if (DateTime.fromISO(createdPST) > DateTime.fromISO(item.last_created)) {
					item.last_created = createdPST;
				}
			}
		}

		return Array.from(map.values()).sort((a, b) =>
			a.affiliate_name?.localeCompare(b.affiliate_name)
		);
	}

	// 🔍 Apply filters manually (run only when user clicks button)
	function applyFilters() {
		const hasFilters = search || startDate || endDate;
		if (!hasFilters) return; // no filters to apply

		const s = search.toLowerCase();

		let filtered = allOrders.filter((o) => {
			const matchesSearch =
				o.affiliate_name?.toLowerCase().includes(s) ||
				o.affiliate_email?.toLowerCase().includes(s) ||
				o.ein?.toLowerCase?.().includes(s);

			const date = DateTime.fromISO(o.createdPST);
			const start = startDate
				? DateTime.fromISO(startDate, { zone: 'America/Los_Angeles' }).startOf('day')
				: null;
			const end = endDate
				? DateTime.fromISO(endDate, { zone: 'America/Los_Angeles' }).endOf('day')
				: null;

			const matchesDate = (!start || date >= start) && (!end || date <= end);
			return matchesSearch && matchesDate;
		});

		filteredOrders = filtered;
		consolidatedOrders = consolidateData(filtered);
		currentPage = 1;
		filtersActive = true;
	}

	// 🔄 Clear all filters
	function clearFilters() {
		search = '';
		startDate = '';
		endDate = '';
		filteredOrders = allOrders;
		consolidatedOrders = consolidateData(allOrders);
		currentPage = 1;
		filtersActive = false;
	}

	// 📄 Pagination
	let totalPages = $derived(Math.max(1, Math.ceil(consolidatedOrders.length / pageSize)));
	let paginated = $derived(
		consolidatedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}
	function prevPage() {
		if (currentPage > 1) currentPage--;
	}

	// Format PST date for display
	function formatPST(dateISO) {
		return DateTime.fromISO(dateISO, { zone: 'America/Los_Angeles' }).toFormat('yyyy-MM-dd HH:mm');
	}

	// 📤 Export filtered data to CSV
	function exportCSV() {
		const rows = consolidatedOrders; // export all filtered data
		const headers = ['Affiliate Name', 'Email', 'EIN', 'Total Commission', 'Statuses'];

		const csvContent = [
			headers.join(','),
			...rows.map((r) =>
				[
					r.affiliate_name,
					r.affiliate_email,
					r.ein,
					r.abm_commission.toFixed(2),
					r.paramount_commission.toFixed(2),
					r.peptideu_commission.toFixed(2),
					r.total_commission.toFixed(2),
					Array.from(r.statuses).join('; ')
				]
					.map((v) => `"${v}"`)
					.join(',')
			)
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute(
			'download',
			`affiliate_orders_${DateTime.now().toFormat('yyyyLLdd_HHmm')}.csv`
		);
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<h1 class="mb-6 text-2xl font-bold">Affiliate Commissions Dashboard</h1>

	<!-- 🔍 Filters -->
	<div class="mb-6 flex flex-wrap items-center gap-3">
		<input
			type="text"
			bind:value={search}
			placeholder="Search name, email, or EIN"
			class="min-w-[250px] flex-1 rounded border p-2"
		/>
		<div class="flex items-center gap-2">
			<input type="date" bind:value={startDate} class="rounded border p-2" />
			<span class="text-gray-500">to</span>
			<input type="date" bind:value={endDate} class="rounded border p-2" />
		</div>

		<!-- Toggle between Apply and Clear Filter -->
		{#if filtersActive}
			<button onclick={clearFilters} class="rounded border bg-gray-200 px-3 py-1 hover:bg-gray-300">
				Clear Filters
			</button>
		{:else}
			<button onclick={applyFilters} class="rounded border bg-blue-200 px-3 py-1 hover:bg-blue-300">
				Apply Filter
			</button>
		{/if}

		<button onclick={exportCSV} class="rounded border bg-green-200 px-3 py-1 hover:bg-green-300">
			Export CSV
		</button>
	</div>

	<!-- 🧮 Stats -->
	<div class="mb-4 text-gray-600">
		{#if loading}
			Loading data... ⏳
		{:else}
			Showing <strong>{consolidatedOrders.length}</strong> affiliates (from
			{filteredOrders.length} filtered transactions / {allOrders.length} total)
		{/if}
	</div>

	<!-- 📋 Table -->
	<div class="overflow-x-auto rounded-xl bg-white shadow">
		<table class="min-w-full text-left text-sm">
			<thead class="bg-gray-100 text-gray-700">
				<tr>
					<th class="p-3">Affiliate Name</th>
					<th class="p-3">Email</th>
					<th class="p-3">EIN</th>
					<th class="p-3 text-right">ABM LLC</th>
					<th class="p-3 text-right">Paramount</th>
					<th class="p-3 text-right">TPU</th>
					<th class="p-3 text-right">Total Commission</th>
					<th class="p-3">Statuses</th>
					<th class="p-3">Date Range</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan="6" class="p-4 text-center text-gray-500">Loading records...</td>
					</tr>
				{:else if consolidatedOrders.length === 0}
					<tr>
						<td colspan="6" class="p-4 text-center text-gray-500">No matching records found.</td>
					</tr>
				{:else}
					{#each paginated as o (o.ein)}
						<tr class="border-b hover:bg-gray-50">
							<td class="p-3">{o.affiliate_name}</td>
							<td class="p-3">{o.affiliate_email}</td>
							<td class="p-3">{o.ein}</td>
							<td class="p-3 text-right">${o.abm_commission.toFixed(2)}</td>
							<td class="p-3 text-right">${o.paramount_commission.toFixed(2)}</td>
							<td class="p-3 text-right">${o.peptideu_commission.toFixed(2)}</td>
							<td class="p-3 text-right font-medium">${o.total_commission.toFixed(2)}</td>
							<td class="p-3 text-gray-600">{Array.from(o.statuses).join(', ')}</td>
							<td class="p-3 text-gray-500">
								{formatPST(o.first_created)} → {formatPST(o.last_created)}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- 📄 Pagination -->
	{#if !loading && consolidatedOrders.length > 0}
		<div class="mt-6 flex items-center justify-between text-sm text-gray-600">
			<div>
				Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
			</div>
			<div class="flex gap-2">
				<button
					onclick={prevPage}
					disabled={currentPage === 1}
					class="rounded border px-3 py-1 disabled:opacity-50"
				>
					Prev
				</button>
				<button
					onclick={nextPage}
					disabled={currentPage === totalPages}
					class="rounded border px-3 py-1 disabled:opacity-50"
				>
					Next
				</button>
			</div>
		</div>
	{/if}
</div>
