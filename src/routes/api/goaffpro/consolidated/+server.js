import { json } from '@sveltejs/kit';
import { getAffiliates, getOrders } from '$lib/goaffprocombine';
import supabase from '$lib/supabaseServer';

export async function GET() {
	console.log('🔹 Starting order enrichment GET...');

	try {
		// 1️⃣ Get current since_ids from Supabase
		const { data: syncRows, error: syncError } = await supabase
			.from('goaffpro_sync_combine')
			.select('name, since_id');

		if (syncError) throw syncError;

		const affiliateSinceId = syncRows.find((r) => r.name === 'affiliate')?.since_id ?? null;
		const orderSinceId = syncRows.find((r) => r.name === 'orders')?.since_id ?? null;

		console.log(`📍 Current since_id → affiliates: ${affiliateSinceId}, orders: ${orderSinceId}`);

		// 2️⃣ Define your 3 API tokens + store labels
		const TOKENS = [
			{ token: '5d7c7806d9545a1d44d0dfd9da39e4b9fc513d43fe24a56cb9ced3280252ac22', store: 'alpha_biomed' },
			{ token: '19c81baa561789d2092ec2b9c8cf9e6828e6fac60a595ac0796eb8b5709c8b31', store: 'paramount_peptide' },
			{ token: '119b42c4df0c93e49a99896495839db5e5f88878266c2f34b341ce96e6e6967d', store: 'the_peptide_university' }
		];

		// 3️⃣ Fetch from all 3 accounts in parallel
		const affiliatePromises = TOKENS.map(({ token }) => getAffiliates(affiliateSinceId, token));
		const orderPromises = TOKENS.map(({ token }) => getOrders(orderSinceId, token));

		const [affiliatesResults, ordersResults] = await Promise.all([
			Promise.all(affiliatePromises),
			Promise.all(orderPromises)
		]);

		// 4️⃣ Attach store name and flatten results
		const affiliates = affiliatesResults.flatMap((res, idx) =>
			(res?.affiliates ?? []).map((a) => ({
				...a,
				store: TOKENS[idx].store
			}))
		);

		const orders = ordersResults.flatMap((res, idx) =>
			(res?.orders ?? []).map((o) => ({
				...o,
				store: TOKENS[idx].store
			}))
		);

		console.log(`📦 Got ${affiliates.length} affiliates and ${orders.length} orders from ${TOKENS.length} accounts`);

		// 5️⃣ Normalize emails (lowercase) and unify EINs by email
		const byEmail = new Map();

		for (const a of affiliates) {
			const email = a.email?.toLowerCase()?.trim();
			if (!email) continue;

			if (!byEmail.has(email)) {
				byEmail.set(email, { ...a }); // first occurrence
			} else {
				const existing = byEmail.get(email);
				// If this one has EIN and existing doesn't, copy it
				if (!existing.tax_identification_number && a.tax_identification_number) {
					existing.tax_identification_number = a.tax_identification_number;
				}
				// If existing has EIN and this one doesn't, assign EIN to this affiliate too
				if (existing.tax_identification_number && !a.tax_identification_number) {
					a.tax_identification_number = existing.tax_identification_number;
				}
				// Merge back
				byEmail.set(email, existing);
			}
		}

		// After EIN unification, rebuild affiliateMap (by ID)
		const affiliateMap = new Map(
			affiliates.map((a) => [
				a.id,
				{
					name: a.name ?? null,
					email: a.email?.toLowerCase() ?? null,
					ein: a.tax_identification_number ?? null,
					store: a.store
				}
			])
		);

		// 6️⃣ Filter only approved orders
		const approvedOrders = orders.filter(
			(o) => o.status?.toLowerCase() === 'approved'
		);

		console.log(`✅ Found ${approvedOrders.length} approved orders`);

		// 7️⃣ Enrich with affiliate info (unchanged, just adds store)
		const enrichedOrders = approvedOrders.map((order) => {
			const affiliate = affiliateMap.get(order.affiliate_id);
			return {
				order_id: order.id,
				affiliate_id: order.affiliate_id,
				affiliate_name: affiliate?.name ?? null,
				affiliate_email: affiliate?.email ?? null,
				ein: affiliate?.ein ?? null,
				commission: Number(order.commission) || 0,
				customer_email: order.customer_email ?? null,
				customer: order.customer ?? null,
				status: order.status ?? null,
				created: order.created,
				store: order.store
			};
		});

		console.log(`✅ Enriched ${enrichedOrders.length} orders successfully`);

		// 8️⃣ Find latest IDs (so we can update goaffpro_sync)
		const latestAffiliateId = affiliates.length ? Math.max(...affiliates.map((a) => a.id)) : affiliateSinceId;
		const latestOrderId = orders.length ? Math.max(...orders.map((o) => o.id)) : orderSinceId;

		// 9️⃣ Update Supabase with new since_ids
		if (latestAffiliateId > affiliateSinceId) {
			await supabase
				.from('goaffpro_sync_combine')
				.update({ since_id: latestAffiliateId })
				.eq('name', 'affiliate');
			console.log(`🔁 Updated affiliate since_id → ${latestAffiliateId}`);
		}

		if (latestOrderId > orderSinceId) {
			await supabase
				.from('goaffpro_sync_combine')
				.update({ since_id: latestOrderId })
				.eq('name', 'orders');
			console.log(`🔁 Updated orders since_id → ${latestOrderId}`);
		}

		// 🔟 Return enriched results
		return json({
			total_orders: enrichedOrders.length,
			orders: enrichedOrders
		});
	} catch (error) {
		console.error('❌ Error in order enrichment API:', error);
		return json({ error: 'Failed to fetch and enrich orders' }, { status: 500 });
	}
}
