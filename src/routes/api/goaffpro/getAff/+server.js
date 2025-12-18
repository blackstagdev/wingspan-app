import { json } from '@sveltejs/kit';
import supabase from '$lib/supabaseServer';

/**
 * Fetch all rows from a Supabase table in batches
 */
async function fetchAll({ table, orderBy }) {
	let allData = [];
	let from = 0;
	const batchSize = 1000;

	while (true) {
		const to = from + batchSize - 1;

		const { data, error } = await supabase
			.from(table)
			.select('*')
			.order(orderBy, { ascending: false })
			.range(from, to);

		if (error) {
			throw error;
		}

		console.log(`📥 ${table}: fetched ${data.length} records (range ${from}-${to})`);
		allData = allData.concat(data);

		if (data.length < batchSize) break;
		from += batchSize;
	}

	return allData;
}

export async function GET() {
	console.log('📦 Fetching affiliate transactions from Supabase...');

	try {
		// 🔹 Transactions = SOURCE OF TRUTH
		const transactions = await fetchAll({
			table: 'affiliate_transaction',
			orderBy: 'date'
		});

		console.log(`✅ Retrieved ${transactions.length} affiliate transactions`);

		return json({
			total_transactions: transactions.length,
			transactions
		});
	} catch (error) {
		console.error('❌ Supabase fetch error:', error);
		return json(
			{ error: 'Failed to fetch affiliate transactions from Supabase' },
			{ status: 500 }
		);
	}
}
