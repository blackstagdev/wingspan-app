// src/lib/saveOrdersToSupabase.js
import supabase from '$lib/supabaseServer';

export async function saveOrdersToSupabase(orders) {
	console.log(`💾 Saving ${orders.length} order transactions to Supabase...`);

	const records = orders.map((o) => ({
		order_id: o.order_id,
		affiliate_id: o.affiliate_id,
		affiliate_name: o.affiliate_name ?? null,
		affiliate_email: o.affiliate_email ?? null,
		ein: o.ein ?? null,
		commission: o.commission ?? 0,
		customer_email: o.customer_email ?? null,
		customer: o.customer ?? null,
		status: o.status ?? null,
		created: o.created ?? null,
		store: o.store ?? null
	}));

	const BATCH_SIZE = 1000;
	let totalInserted = 0;
	const failedBatches = [];

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		const batchNum = i / BATCH_SIZE + 1;
		console.log(`📦 Inserting batch ${batchNum}/${Math.ceil(records.length / BATCH_SIZE)} (${batch.length} rows)...`);

		const { error } = await supabase
			.from('affiliate_orders_combine')
			.upsert(batch, { onConflict: 'order_id' });

		if (error) {
			console.error(`❌ Batch ${batchNum} failed:`, error.message);
			failedBatches.push(batchNum);
			continue;
		}

		totalInserted += batch.length;
		console.log(`✅ Batch ${batchNum} inserted successfully (${batch.length} rows).`);
	}

	console.log(`🏁 Done — ${totalInserted} total inserted, ${failedBatches.length} failed.`);

	return {
		success: failedBatches.length === 0,
		totalInserted,
		failedBatches
	};
}

export async function saveAffiliateTransactionsToSupabase(transactions) {
	console.log(`💾 Saving ${transactions.length} affiliate transactions to Supabase...`);

	const records = transactions.map((t) => ({
		date: t.date, // already normalized
		affiliate_id: Number(t.affiliate_id),

		// ✅ store affiliate snapshot
		affiliate_name: t.affiliate_name ?? null,
		affiliate_email: t.affiliate_email ?? null,
		ein: t.ein ?? null,

		entity_type: t.entity_type ?? 'transaction',
		amount: Number(t.amount) || 0,
		is_paid: t.is_paid ?? false,
		store: t.store ?? 'unknown'
	}));

	const BATCH_SIZE = 1000;
	let totalInserted = 0;
	const failedBatches = [];

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		const batchNum = i / BATCH_SIZE + 1;

		const { error } = await supabase
			.from('affiliate_transaction')
			.insert(batch);

		if (error) {
			console.error(`❌ Batch ${batchNum} failed:`, error.message);
			failedBatches.push(batchNum);
			continue;
		}

		totalInserted += batch.length;
	}

	console.log(`🏁 Done — ${totalInserted} total inserted, ${failedBatches.length} failed.`);

	return {
		success: failedBatches.length === 0,
		totalInserted,
		failedBatches
	};
}



