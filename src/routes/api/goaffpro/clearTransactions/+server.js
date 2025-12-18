import { json } from '@sveltejs/kit';
import supabase from '$lib/supabaseServer';

export async function POST() {
	try {
		console.log('🧹 Clearing affiliate_transaction table (FULL RESET)');

		const { error } = await supabase
			.from('affiliate_transaction')
			.delete()
			.neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

		if (error) {
			throw error;
		}

		return json({ success: true });
	} catch (err) {
		console.error('❌ Failed to clear affiliate_transaction:', err);
		return json(
			{ success: false, error: err.message },
			{ status: 500 }
		);
	}
}
