import { json } from '@sveltejs/kit';
import { getAffiliates, getTransactions } from '$lib/goaffprocombine';
import supabase from '$lib/supabaseServer';

export async function GET() {
	console.log('🔹 Starting affiliate transaction enrichment GET...');

	try {
		// 1️⃣ Get affiliate since_id (transactions are full pull)
		const { data: syncRows, error: syncError } = await supabase
			.from('goaffpro_sync_combine')
			.select('name, since_id');

		if (syncError) throw syncError;

		const affiliateSinceId =
			syncRows.find((r) => r.name === 'affiliate')?.since_id ?? null;

		console.log(`📍 since_id → affiliates: ${affiliateSinceId}`);

		// 2️⃣ API tokens
		const TOKENS = [
			{
				token: '119b42c4df0c93e49a99896495839db5e5f88878266c2f34b341ce96e6e6967d',
				store: 'the_peptide_university'
			},
			{
				token: '04fe42fda80a9b50f064c6314fdc8c4db84cd779c1988250000b4e91e8a273bd',
				store: 'paramount_peptide'
			},
			{
				token: '5d7c7806d9545a1d44d0dfd9da39e4b9fc513d43fe24a56cb9ced3280252ac22',
				store: 'alpha_biomed'
			}
		];

		// 3️⃣ Fetch affiliates (blocking)
		const affiliateResults = await Promise.all(
			TOKENS.map(({ token }) => getAffiliates(affiliateSinceId, token))
		);

		// 4️⃣ Fetch transactions (non-blocking)
		let transactionResults = [];
		try {
			transactionResults = await Promise.all(
				TOKENS.map(({ token }) => getTransactions(token))
			);
		} catch {
			console.warn('⚠️ Transactions fetch failed — continuing');
		}

		// 5️⃣ Flatten + attach store
		const affiliates = affiliateResults.flatMap((res, idx) =>
			(res?.affiliates ?? []).map((a) => ({
				...a,
				store: TOKENS[idx].store
			}))
		);

		const transactions = transactionResults.flatMap((res, idx) =>
			(res?.transactions ?? []).map((t) => ({
				...t,
				store: TOKENS[idx].store
			}))
		);

		console.log(
			`📦 affiliates=${affiliates.length}, transactions=${transactions.length}`
		);

		// 6️⃣ Normalize EINs by email
		const byEmail = new Map();

		for (const a of affiliates) {
			const email = a.email?.toLowerCase()?.trim();
			if (!email) continue;

			if (!byEmail.has(email)) {
				byEmail.set(email, { ...a });
			} else {
				const existing = byEmail.get(email);
				if (!existing.tax_identification_number && a.tax_identification_number) {
					existing.tax_identification_number = a.tax_identification_number;
				}
				if (existing.tax_identification_number && !a.tax_identification_number) {
					a.tax_identification_number = existing.tax_identification_number;
				}
			}
		}

		// 7️⃣ Build affiliate lookup (normalized ID)
		const affiliateMap = new Map(
			affiliates.map((a) => [
				Number(a.id),
				{
					affiliate_name: a.name ?? null,
					affiliate_email: a.email?.toLowerCase() ?? null,
					ein: a.tax_identification_number ?? null
				}
			])
		);

		// 8️⃣ Enrich transactions (SOURCE OF TRUTH)
		const enrichedTransactions = transactions.map((t) => {
			const affiliateId = Number(t.affiliate_id);
			const affiliate = affiliateMap.get(affiliateId);

			return {
				date: t.created_at, // ✅ correct + NOT NULL safe
				affiliate_id: affiliateId,

				affiliate_name: affiliate?.affiliate_name ?? null,
				affiliate_email: affiliate?.affiliate_email ?? null,
				ein: affiliate?.ein ?? null,

				entity_type: t.entity_type ?? 'transaction',
				amount: Number(t.amount) || 0,
				is_paid: t.status?.toLowerCase() === 'paid',
				store: t.store
			};
		});

		console.log(`✅ Enriched transactions=${enrichedTransactions.length}`);

		// 9️⃣ Return (orders removed)
		return json({
			total_transactions: enrichedTransactions.length,
			transactions: enrichedTransactions
		});
	} catch (error) {
		console.error('❌ Error in enrichment API:', error);
		return json(
			{ error: 'Failed to fetch and enrich affiliate transactions' },
			{ status: 500 }
		);
	}
}
