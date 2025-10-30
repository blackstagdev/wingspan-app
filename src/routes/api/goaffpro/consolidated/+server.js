import { json } from '@sveltejs/kit';
import { getAffiliates, getOrders } from '$lib/goaffpro';
import  supabase  from '$lib/supabaseServer'; 

// --- 🧩 GET: Fetch and enrich order data ---
export async function GET() {
	console.log('🔹 Starting order enrichment GET...');

	try {
		// 1️⃣ Get current since_ids from Supabase
		const { data: syncRows, error: syncError } = await supabase
			.from('goaffpro_sync')
			.select('name, since_id');

		if (syncError) throw syncError;

		const affiliateSinceId = syncRows.find((r) => r.name === 'affiliate')?.since_id ?? null;
		const orderSinceId = syncRows.find((r) => r.name === 'orders')?.since_id ?? null;

		console.log(`📍 Current since_id → affiliates: ${affiliateSinceId}, orders: ${orderSinceId}`);

		// 2️⃣ Fetch from GoAffPro using since_id (instead of date)
		const [affiliatesRes, ordersRes] = await Promise.all([
			getAffiliates(affiliateSinceId),
			getOrders(orderSinceId)
		]);

		const affiliates = affiliatesRes?.affiliates ?? [];
		const orders = ordersRes?.orders ?? [];

		console.log(`📦 Got ${affiliates.length} affiliates and ${orders.length} orders`);

		// 3️⃣ Create affiliate lookup
		const affiliateMap = new Map(
			affiliates.map((a) => [
				a.id,
				{
					name: a.name ?? null,
					email: a.email?.toLowerCase() ?? null,
					ein: a.tax_identification_number ?? null
				}
			])
		);

		// 4️⃣ Filter only approved orders
		const approvedOrders = orders.filter(
			(o) => o.status?.toLowerCase() === 'approved'
		);

		console.log(`✅ Found ${approvedOrders.length} approved orders`);

		// 5️⃣ Enrich with affiliate info
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
				created: order.created
			};
		});

		console.log(`✅ Enriched ${enrichedOrders.length} orders successfully`);

		// 6️⃣ Find latest IDs (so we can update goaffpro_sync)
		const latestAffiliateId = affiliates.length ? Math.max(...affiliates.map((a) => a.id)) : affiliateSinceId;
		const latestOrderId = orders.length ? Math.max(...orders.map((o) => o.id)) : orderSinceId;

		// 7️⃣ Update Supabase with new since_ids
		if (latestAffiliateId > affiliateSinceId) {
			await supabase
				.from('goaffpro_sync')
				.update({ since_id: latestAffiliateId })
				.eq('name', 'affiliate');
			console.log(`🔁 Updated affiliate since_id → ${latestAffiliateId}`);
		}

		if (latestOrderId > orderSinceId) {
			await supabase
				.from('goaffpro_sync')
				.update({ since_id: latestOrderId })
				.eq('name', 'orders');
			console.log(`🔁 Updated orders since_id → ${latestOrderId}`);
		}

		// 8️⃣ Return enriched results
		return json({
			total_orders: enrichedOrders.length,
			orders: enrichedOrders
		});
	} catch (error) {
		console.error('❌ Error in order enrichment API:', error);
		return json({ error: 'Failed to fetch and enrich orders' }, { status: 500 });
	}
}
