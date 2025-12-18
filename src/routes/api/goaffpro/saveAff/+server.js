// saveAff/+server.js
import { json } from '@sveltejs/kit';
import { saveAffiliateTransactionsToSupabase } from '$lib/saveConsolidated';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const transactions = body?.transactions ?? [];

		if (!transactions.length) {
			return json({ success: true, inserted: 0 });
		}

		const result = await saveAffiliateTransactionsToSupabase(transactions);

		return json({
			success: true,
			inserted: result.totalInserted
		});
	} catch (err) {
		console.error('❌ saveAff failed:', err);
		return json(
			{ success: false, error: err.message },
			{ status: 500 }
		);
	}
}
