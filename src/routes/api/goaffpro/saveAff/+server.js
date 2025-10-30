import { json } from '@sveltejs/kit';
import { saveOrdersToSupabase } from '$lib/saveConsolidated';

export async function POST({ request }) {
	try {
		const orders = await request.json();

		if (!Array.isArray(orders)) {
			return json({ error: 'Expected an array of orders' }, { status: 400 });
		}

		const result = await saveOrdersToSupabase(orders);

		return json({
			success: true,
			inserted: result.length,
			data: result
		});
	} catch (err) {
		console.error('❌ Error saving orders:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
}
