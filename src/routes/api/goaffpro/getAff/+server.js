import { json } from '@sveltejs/kit';
import supabase from '$lib/supabaseServer';

export async function GET() {
	console.log('📦 Fetching ALL affiliate orders from Supabase...');

	let allData = [];
	let from = 0;
	const batchSize = 1000;

	while (true) {
		const to = from + batchSize - 1;
		const { data, error } = await supabase
			.from('affiliate_orders')
			.select('*')
			.order('created', { ascending: false })
			.range(from, to);

		if (error) {
			console.error('❌ Supabase fetch error:', error);
			return json({ error: 'Failed to fetch data from Supabase' }, { status: 500 });
		}

		console.log(`📥 Fetched ${data.length} records (range: ${from}-${to})`);
		allData = allData.concat(data);

		if (data.length < batchSize) break; // no more data
		from += batchSize;
	}

	console.log(`✅ Retrieved total of ${allData.length} records from Supabase`);

	return json({
		total_orders: allData.length,
		orders: allData
	});
}
